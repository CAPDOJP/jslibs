/*
*--------------------------------------------------------------------
* jQuery-Plugin "timetable-daily"
* Version: 3.0
* Copyright (c) 2016 TIS
*
* Released under the MIT License.
* http://tis2010.jp/license.txt
* -------------------------------------------------------------------
*/
jQuery.noConflict();
(function($,PLUGIN_ID){
	"use strict";
	/*---------------------------------------------------------------
	 valiable
	---------------------------------------------------------------*/
	var vars={
		date:new Date(),
		calendar:null,
		route:null,
		table:null,
		apps:{},
		config:{},
		levels:{},
		offset:{},
		segments:{},
		colors:[],
		displays:[],
		fields:[],
		segmentkeys:[],
		fieldinfos:{}
	};
	var events={
		lists:[
			'app.record.index.show'
		],
		show:[
			'app.record.create.show',
			'app.record.edit.show'
		]
	};
	var limit=500;
	var functions={
		/* rebuild view */
		build:function(filter,heads,colorindex){
			if (vars.config['registeredonly']=='1' && filter.length==0) return;
			var color=vars.colors[colorindex%vars.colors.length];
			/* insert row */
			vars.table.insertrow(null,function(row){
				var baserow=row;
				var index=0;
				if (vars.levels.lookup)
				{
					for (var i=0;i<vars.segmentkeys.length;i++)
					{
						baserow.find('td').eq(i).append($('<p>').addClass('customview-p').html($.fieldvalue(heads[vars.segmentkeys[i]])));
						if (i==0) baserow.find('td').eq(i).append($('<input type="hidden" id="segment">').val($.fieldvalue(heads[vars.levels.relatedkey])));
					}
				}
				else
				{
					$.each(heads,function(key,values){
						baserow.find('td').eq(index)
						.append($('<p>').addClass('customview-p').html(values.display))
						.append($('<input type="hidden" id="segment">').val(values.field));
						index++;
					});
				}
				if (vars.config['route']=='1')
				{
					baserow.find('td').eq(0).append($('<button class="customview-button compass-button">').text('地図を表示').on('click',function(){
						/* display routemap */
						var markers=[];
						var rowindex=vars.table.contents.find('tr').index($(this).closest('tr'));
						var rowspan=(parseInt('0'+$(this).closest('tr').find('td').eq(0).attr('rowspan'))!=0)?parseInt('0'+$(this).closest('tr').find('td').eq(0).attr('rowspan')):1;
						for (var i=rowindex;i<rowindex+rowspan;i++)
						{
							var row=vars.table.contents.find('tr').eq(i);
							$.each(row.find('td'),function(index){
								if ($(this).find('input#\\$id').size())
								{
									var lat=parseFloat('0'+$(this).find('input#'+vars.config['lat']).val());
									var lng=parseFloat('0'+$(this).find('input#'+vars.config['lng']).val());
									if (lat+lng!=0)
										markers.push({
											from:vars.table.cellindex(row,index),
											label:$(this).find('p').text(),
											lat:$(this).find('input#'+vars.config['lat']).val(),
											lng:$(this).find('input#'+vars.config['lng']).val()
										});
								}
							});
						}
						if (markers.length==0)
						{
							swal('Error!','位置情報が設定されたセルがありません。','error');
							return;
						}
						markers.sort(function(a,b){
							if(a.from<b.from) return -1;
							if(a.from>b.from) return 1;
							return 0;
						});
						vars.route.reloadmap({markers:markers});
					}));
				}
				if (filter.length!=0)
				{
					for (var i=0;i<filter.length;i++)
					{
						/* create cell */
						var fromtime=new Date((vars.date.format('Y-m-d')+'T'+filter[i][vars.config['fromtime']].value+':00+09:00').dateformat());
						var totime=new Date((vars.date.format('Y-m-d')+'T'+filter[i][vars.config['totime']].value+':00+09:00').dateformat());
						var from=(fromtime.getHours())*parseInt(vars.config['scale'])+Math.floor(fromtime.getMinutes()/(60/parseInt(vars.config['scale'])));
						var to=(totime.getHours())*parseInt(vars.config['scale'])+Math.ceil(totime.getMinutes()/(60/parseInt(vars.config['scale'])))-1;
						var fromindex=0;
						var toindex=0;
						if (from<parseInt(vars.config['starthour'])*parseInt(vars.config['scale'])) from=parseInt(vars.config['starthour'])*parseInt(vars.config['scale']);
						if (to<parseInt(vars.config['starthour'])*parseInt(vars.config['scale'])) continue;
						if (to>(parseInt(vars.config['endhour'])+1)*parseInt(vars.config['scale'])-1) to=(parseInt(vars.config['endhour'])+1)*parseInt(vars.config['scale'])-1;
						from+=vars.segmentkeys.length;
						to+=vars.segmentkeys.length;
						/* check cell merged */
						var isinsertrow=true;
						var mergerow=baserow;
						for (var i2=vars.table.contents.find('tr').index(baserow);i2<vars.table.contents.find('tr').length;i2++)
						{
							mergerow=vars.table.contents.find('tr').eq(i2);
							fromindex=vars.table.mergecellindex(mergerow,from);
							toindex=vars.table.mergecellindex(mergerow,to);
							if (!mergerow.find('td').eq(fromindex).hasClass('timetable-daily-merge') && !mergerow.find('td').eq(toindex).hasClass('timetable-daily-merge')) {isinsertrow=false;break;}
						}
						/* merge cell */
						if (isinsertrow)
						{
							vars.table.insertrow(null,function(row){
								fromindex=vars.table.mergecellindex(row,from);
								toindex=vars.table.mergecellindex(row,to);
								functions.mergeaftervalue(row,fromindex,toindex,filter[i],color);
								/* check row heads */
								for (var i2=0;i2<vars.segmentkeys.length;i2++) row.find('td').eq(i2).html(baserow.find('td').eq(i2).html());
							});
						}
						else functions.mergeaftervalue(mergerow,fromindex,toindex,filter[i],color);
					}
				}
			});
		},
		/* setup merge cell value */
		mergeaftervalue:function(row,from,to,filter,color){
			var cell=row.find('td').eq(from);
			vars.table.mergecell(
				cell,
				from,
				to
			);
			/* cell value switching */
			var displays=$('<p>').addClass('timetable-daily-merge-p');
			for (var i=0;i<vars.displays.length;i++) displays.append($('<span>').html($.fieldvalue(filter[vars.displays[i]])));
			row.find('td').eq(from).append(displays);
			row.find('td').eq(from).append($('<span>').addClass('timetable-daily-merge-span').css({'background-color':'#'+color}));
			if (vars.config['registeredonly']=='1') row.find('td').eq(from).on('click',function(){
				sessionStorage.setItem('date_timetable-daily',vars.date.format('Y-m-d').dateformat());
				window.location.href=kintone.api.url('/k/', true).replace(/\.json/g,'')+kintone.app.getId()+'/show#record='+$(this).find('input#\\$id').val()+'&mode=show';
			});
			$.each(filter,function(key,values){
				if (values!=null)
					if (values.value!=null)
						row.find('td').eq(from).append($('<input type="hidden">').attr('id',key).val(values.value));
			});
			/* append balloon */
			var balloon=$('<div class="timetable-balloon">');
			var inner='';
			inner+='<p>';
			for (var i=0;i<vars.displays.length;i++) inner+='<p>'+$.fieldvalue(filter[vars.displays[i]])+'</p>';
			$('body').append(
				balloon.css({
					'z-index':(vars.apps[kintone.app.getId()].length+$('div.timetable-balloon').length+1).toString()
				})
				.html(inner)
			);
			/* setup cell datas */
			$.data(cell[0],'balloon',balloon);
			/* mouse events */
			cell.on({
				'mouseenter':function(){$.data($(this)[0],'balloon').addClass('timetable-balloon-show');},
				'mouseleave':function(){$.data($(this)[0],'balloon').removeClass('timetable-balloon-show');}
			});
		},
		/* reload view */
		load:function(){
			/* after apprecords acquisition,rebuild view */
			vars.apps[kintone.app.getId()]=[];
			vars.offset[kintone.app.getId()]=0;
			functions.loaddatas(kintone.app.getId(),function(){
				var records=vars.apps[kintone.app.getId()];
				var heads={
					index:0,
					prev:1,
					total:1,
					values:[]
				};
				/* clear balloon */
				$('div.timetable-balloon').remove();
				/* create rowheads */
				if (vars.levels.lookup) heads.values=vars.apps[vars.levels.app];
				else
				{
					$.each(vars.segments,function(key,values){heads.total*=values.records.length;});
					for (var i=0;i<heads.total;i++) heads.values.push({});
					$.each(vars.segments,function(key,values){
						heads.index=0;
						for (var i=0;i<heads.prev;i++)
							for (var i2=0;i2<values.records.length;i2++)
								for (var i3=0;i3<heads.total/heads.prev/values.records.length;i3++)
								{
									heads.values[heads.index][key]=values.records[i2];
									heads.index++;
								}
						heads.prev*=values.records.length;
					});
				}
				/* initialize table */
				vars.table.clearrows();
				/* place the segment data */
				if (vars.levels.lookup)
				{
					for (var i=0;i<heads.values.length;i++)
					{
						var filter=$.grep(records,function(item,index){
							return item[vars.levels.lookup].value==heads.values[i][vars.levels.relatedkey].value;
						});
						/* rebuild view */
						functions.build(filter,heads.values[i],i);
					}
				}
				else
				{
					for (var i=0;i<heads.values.length;i++)
					{
						var filter=$.grep(records,function(item,index){
							var exists=0;
							$.each(heads.values[i],function(key,values){if (item[key].value==values.field) exists++;});
							return exists==Object.keys(heads.values[i]).length;
						});
						/* rebuild view */
						functions.build(filter,heads.values[i],i);
					}
				}
				/* merge row */
				var rowspans=[];
				for (var i=0;i<vars.segmentkeys.length;i++) rowspans.push({cache:'',index:-1,span:0});
				$.each(vars.table.contents.find('tr'),function(index){
					var row=vars.table.contents.find('tr').eq(index);
					for (var i=0;i<vars.segmentkeys.length;i++)
					{
						var cell=row.find('td').eq(i);
						if (rowspans[i].cache!=cell.find('p').text())
						{
							if (rowspans[i].index!=-1)
							{
								vars.table.contents.find('tr').eq(rowspans[i].index).find('td').eq(i).attr('rowspan',rowspans[i].span);
								for (var i2=rowspans[i].index+1;i2<index;i2++) vars.table.contents.find('tr').eq(i2).find('td').eq(i).hide();
							}
							rowspans[i].cache=cell.find('p').text();
							rowspans[i].index=index;
							rowspans[i].span=0;
							for (var i2=i+1;i2<vars.segmentkeys.length;i2++)
							{
								cell=row.find('td').eq(i2);
								if (rowspans[i2].index!=-1)
								{
									vars.table.contents.find('tr').eq(rowspans[i2].index).find('td').eq(i2).attr('rowspan',rowspans[i2].span);
									for (var i3=rowspans[i2].index+1;i3<index;i3++) vars.table.contents.find('tr').eq(i3).find('td').eq(i2).hide();
								}
								rowspans[i2].cache=cell.find('p').text();
								rowspans[i2].index=index;
								rowspans[i2].span=0;
							}
						}
						rowspans[i].span++;
					}
				});
				var index=vars.table.contents.find('tr').length-1;
				var row=vars.table.contents.find('tr').last();
				for (var i=0;i<vars.segmentkeys.length;i++)
				{
					var cell=row.find('td').eq(i);
					if (rowspans[i].cache==cell.find('p').text() && rowspans[i].index!=index)
					{
						vars.table.contents.find('tr').eq(rowspans[i].index).find('td').eq(i).attr('rowspan',rowspans[i].span);
						for (var i2=rowspans[i].index+1;i2<index+1;i2++) vars.table.contents.find('tr').eq(i2).find('td').eq(i).hide();
					}
				}
				$.each(vars.table.contents.find('tr'),function(index){
					var height=0;
					var row=vars.table.contents.find('tr').eq(index);
					$.each($('.timetable-daily-merge',row),function(){
						if (height<$(this).find('.timetable-daily-merge-p').outerHeight(true)) height=$(this).find('.timetable-daily-merge-p').outerHeight(true);
					});
					$.each($('.timetable-daily-merge',row),function(){
						$(this).css({'padding-top':height.toString()+'px'});
					});
				});
			});
		},
		/* reload datas */
		loaddatas:function(appkey,callback){
			var sort='';
			var query=kintone.app.getQueryCondition();
			var body={
				app:appkey,
				query:'',
				fields:vars.fields
			};
			query+=((query.length!=0)?' and ':'');
			query+=vars.config['date']+'="'+vars.date.format('Y-m-d')+'"';
			sort=' order by ';
			$.each(vars.segments,function(key,values){sort+=key+' asc,';});
			sort+=vars.config['fromtime']+' asc limit '+limit.toString()+' offset '+vars.offset[appkey].toString();
			body.query+=query+sort;
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				Array.prototype.push.apply(vars.apps[appkey],resp.records);
				vars.offset[appkey]+=limit;
				if (resp.records.length==limit) functions.loaddatas(appkey,callback);
				else callback();
			},function(error){});
		},
		/* reload datas of level */
		loadlevels:function(callback){
			var body={
				app:vars.levels.app,
				query:vars.fieldinfos[vars.levels.lookup].lookup.filterCond
			};
			body.query+=' order by ';
			for (var i=0;i<vars.segmentkeys.length;i++) body.query+=vars.segmentkeys[i]+' asc,';
			body.query=body.query.replace(/,$/g,'');
			body.query+=' limit '+limit.toString()+' offset '+vars.offset[vars.levels.app].toString();
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				Array.prototype.push.apply(vars.apps[vars.levels.app],resp.records);
				vars.offset[vars.levels.app]+=limit;
				if (resp.records.length==limit) functions.loadlevels(callback);
				else callback();
			},function(error){});
		},
		/* reload datas of segment */
		loadsegments:function(param,callback){
			var body={
				app:param.app,
				query:vars.fieldinfos[param.code].lookup.filterCond+' order by '+param.field+' '+param.sort+' limit '+limit.toString()+' offset '+param.offset.toString()
			};
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				var records=[]
				$.each(resp.records,function(index,values){
					records.push({display:values[param.display].value,field:values[param.field].value});
				});
				Array.prototype.push.apply(param.records,records);
				param.offset+=limit;
				if (resp.records.length==limit) functions.loadsegments(param,callback);
				else {param.loaded=1;callback(param);}
			},function(error){});
		},
		/* check for completion of load */
		checkloaded:function(){
			var loaded=0;
			var total=0;
			$.each(vars.segments,function(key,values){loaded+=values.loaded;total++;});
			/* reload view */
			if (loaded==total) functions.load();
		}
	};
	/*---------------------------------------------------------------
	 mouse events
	---------------------------------------------------------------*/
	$(window).on('mousemove',function(e){
		/* move balloon */
		$('div.timetable-balloon').css({
		  'left':e.clientX,
		  'top':e.clientY
		});
	});
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.lists,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return false;
		/* check viewid */
		if (event.viewId!=vars.config.datetimetable) return;
		/* get query strings */
		var queries=$.queries();
		if (vars.config['date'] in queries) vars.date=new Date(queries[vars.config['date']].dateformat());
		/* initialize valiable */
		var container=$('div#timetable-container').css({'padding-bottom':'100px'});
		var feed=$('<div class="timetable-dayfeed">');
		var date=$('<span id="date" class="customview-span">');
		var button=$('<button id="datepick" class="customview-button calendar-button">');
		var prev=$('<button id="prev" class="customview-button prev-button">');
		var next=$('<button id="next" class="customview-button next-button">');
		var guidefrom=$('<div class="guidefrom">');
		var guideto=$('<div class="guideto">');
		var week=['日','月','火','水','木','金','土'];
		/* append elements */
		feed.append(prev);
		feed.append(date);
		feed.append(button);
		feed.append(next);
		if ($('.timetable-dayfeed').size()) $('.timetable-dayfeed').remove();
		kintone.app.getHeaderMenuSpaceElement().appendChild(feed[0]);
		$('body').append(guidefrom).append(guideto);
		/* fixed header */
		var headeractions=$('div.contents-actionmenu-gaia');
		var headerspace=$(kintone.app.getHeaderSpaceElement());
		headeractions.parent().css({'position':'relative'});
		headerspace.parent().css({'position':'relative'});
		$(window).on('load resize scroll',function(e){
			headeractions.css({
				'left':$(window).scrollLeft().toString()+'px',
				'position':'absolute',
				'top':'0px',
				'width':$(window).width().toString()+'px'
			});
			headerspace.css({
				'left':$(window).scrollLeft().toString()+'px',
				'position':'absolute',
				'top':headeractions.outerHeight(false)+'px',
				'width':$(window).width().toString()+'px'
			});
			container.css({'margin-top':(headeractions.outerHeight(false)+headerspace.outerHeight(false))+'px','overflow-x':'visible'});
		});
		/* setup date value */
		if (sessionStorage.getItem('date_timetable-daily'))
		{
			vars.date=new Date(sessionStorage.getItem('date_timetable-daily'));
			sessionStorage.removeItem('date_timetable-daily');
		}
		date.text(vars.date.format('Y-m-d')+' ('+week[vars.date.getDay()]+')');
		/* day pickup button */
		vars.calendar=$('body').calendar({
			selected:function(target,value){
				vars.date=new Date(value.dateformat());
				date.text(value+' ('+week[vars.date.getDay()]+')');
				/* reload view */
				functions.load();
			}
		});
		button.on('click',function(){
			vars.calendar.show({activedate:vars.date});
		});
		/* day feed button */
		$.each([prev,next],function(){
			$(this).on('click',function(){
				var days=($(this).attr('id')=='next')?1:-1;
				vars.date=vars.date.calc(days+' day');
				date.text(vars.date.format('Y-m-d')+' ('+week[vars.date.getDay()]+')');
				/* reload view */
				functions.load();
			});
		});
		/* setup colors value */
		vars.colors=vars.config['segmentcolors'].split(',');
		/* setup displays value */
		vars.displays=vars.config['displays'].split(',');
		/* setup levels value */
		vars.levels=JSON.parse(vars.config['levels']);
		/* setup segments value */
		vars.segments=JSON.parse(vars.config['segment']);
		if (vars.levels.lookup) vars.segmentkeys=vars.levels.levels;
		else vars.segmentkeys=Object.keys(vars.segments);
		/* create table */
		container.empty();
		var head=$('<tr></tr><tr></tr>');
		var template=$('<tr>');
		var spacer=$('<span>');
		var mergeexclude=[];
		for (var i=0;i<vars.segmentkeys.length;i++)
		{
			head.eq(0).append($('<th class="timetable-daily-cellhead">'));
			head.eq(1).append($('<th class="timetable-daily-cellhead">'));
			template.append($('<td class="timetable-daily-cellhead">'));
			mergeexclude.push(i);
		}
		if (vars.config['scalefixed']=='1') spacer.css({'display':'block','height':'1px','width':vars.config['scalefixedwidth']+'px'});
		for (var i=0;i<24;i++)
		{
			var hide='';
			if (i<parseInt(vars.config['starthour'])) hide='class="hide"';
			if (i>parseInt(vars.config['endhour'])) hide='class="hide"';
			head.eq(0).append($('<th colspan="'+vars.config['scale']+'" '+hide+'>').text(i));
			for (var i2=0;i2<parseInt(vars.config['scale']);i2++)
			{
				if (vars.config['scalefixed']=='1') head.eq(1).append($('<th '+hide+'>').append(spacer.clone(false)));
				else head.eq(1).append($('<th '+hide+'>'));
				template.append($('<td '+hide+'>'));
			}
		}
		vars.table=$('<table id="timetable" class="customview-table timetable-daily '+((vars.config['scalefixed']=='1')?'cellfixed':'')+'">').mergetable({
			container:container,
			head:head,
			template:template,
			dragclass:'timetable-daily-drag',
			merge:(vars.config['registeredonly']!='1'),
			mergeexclude:mergeexclude,
			mergeclass:'timetable-daily-merge',
			mergetrigger:function(caller,cell,rowindex,cellfrom,cellto){
				var query='';
				var fromhour=Math.floor((caller.cellindex(cell.parent(),cellfrom)-vars.segmentkeys.length)/parseInt(vars.config['scale']));
				var tohour=Math.floor((caller.cellindex(cell.parent(),cellto)-vars.segmentkeys.length+1)/parseInt(vars.config['scale']));
				var fromminute=(caller.cellindex(cell.parent(),cellfrom)-vars.segmentkeys.length)%parseInt(vars.config['scale'])*(60/parseInt(vars.config['scale']));
				var tominute=(caller.cellindex(cell.parent(),cellto)-vars.segmentkeys.length+1)%parseInt(vars.config['scale'])*(60/parseInt(vars.config['scale']));
				if (tohour=='24' && tominute=='00')
				{
					tohour='23';
					tominute='59';
				}
				query+=vars.config['date']+'='+vars.date.format('Y-m-d');
				query+='&'+vars.config['fromtime']+'='+fromhour.toString().lpad('0',2)+':'+fromminute.toString().lpad('0',2);
				query+='&'+vars.config['totime']+'='+tohour.toString().lpad('0',2)+':'+tominute.toString().lpad('0',2);
				if (vars.levels.lookup) query+='&'+vars.levels.lookup+'='+caller.contents.find('tr').eq(rowindex).find('td').first().find('input#segment').val();
				else for (var i=0;i<vars.segmentkeys.length;i++) query+='&'+vars.segmentkeys[i]+'='+caller.contents.find('tr').eq(rowindex).find('td').eq(i).find('input#segment').val();
				sessionStorage.setItem('date_timetable-daily',vars.date.format('Y-m-d').dateformat());
				window.location.href=kintone.api.url('/k/', true).replace(/\.json/g,'')+kintone.app.getId()+'/edit?'+query;
			},
			unmergetrigger:function(caller,cell,rowindex,cellindex){
				sessionStorage.setItem('date_timetable-daily',vars.date.format('Y-m-d').dateformat());
				window.location.href=kintone.api.url('/k/', true).replace(/\.json/g,'')+kintone.app.getId()+'/show#record='+cell.find('input#\\$id').val()+'&mode=show';
			},
			callback:{
				guidestart:function(e,caller,table,rowindex,cellindex){
					if (rowindex==null) {guidefrom.hide();return;}
					var row=table.find('tbody').find('tr').eq(rowindex);
					var hour=Math.floor((caller.cellindex(row,cellindex)-vars.segmentkeys.length)/parseInt(vars.config['scale']));
					var minute=(caller.cellindex(row,cellindex)-vars.segmentkeys.length)%parseInt(vars.config['scale'])*(60/parseInt(vars.config['scale']));
					guidefrom.text(hour.toString().lpad('0',2)+':'+minute.toString().lpad('0',2)).show().css({
					  'left':(row.find('td').eq(cellindex).offset().left-$(window).scrollLeft()).toString()+'px',
					  'top':(row.offset().top-$(window).scrollTop()-guidefrom.outerHeight(true)).toString()+'px'
					});
				},
				guide:function(e,caller,table,rowindex,cellfrom,cellto){
					var row=table.find('tbody').find('tr').eq(rowindex);
					var fromhour=Math.floor((caller.cellindex(row,cellfrom)-vars.segmentkeys.length)/parseInt(vars.config['scale']));
					var tohour=Math.floor((caller.cellindex(row,cellto)-vars.segmentkeys.length+1)/parseInt(vars.config['scale']));
					var fromminute=(caller.cellindex(row,cellfrom)-vars.segmentkeys.length)%parseInt(vars.config['scale'])*(60/parseInt(vars.config['scale']));
					var tominute=(caller.cellindex(row,cellto)-vars.segmentkeys.length+1)%parseInt(vars.config['scale'])*(60/parseInt(vars.config['scale']));
					guidefrom.text(fromhour.toString().lpad('0',2)+':'+fromminute.toString().lpad('0',2)).show().css({
					  'left':(row.find('td').eq(cellfrom).offset().left-$(window).scrollLeft()).toString()+'px',
					  'top':(row.offset().top-$(window).scrollTop()-guidefrom.outerHeight(true)).toString()+'px'
					});
					guideto.text(tohour.toString().lpad('0',2)+':'+tominute.toString().lpad('0',2)).show().css({
					  'left':(row.find('td').eq(cellto).offset().left-$(window).scrollLeft()+row.find('td').eq(cellto).outerWidth(true)).toString()+'px',
					  'top':(row.offset().top-$(window).scrollTop()+row.outerHeight(true)).toString()+'px'
					});
				},
				guideend:function(e){
					guidefrom.hide();
					guideto.hide();
				}
			}
		});
		/* create routemap box */
		if (vars.config['route']=='1') vars.route=$('body').routemap(vars.config['apikey'],true,true,null,(vars.route!=null));
		/* get fields of app */
		kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
			vars.fields=['$id'];
			vars.fieldinfos=resp.properties;
			$.each(resp.properties,function(key,values){
				vars.fields.push(values.code);
			});
			/* get datas of segment */
			if (vars.levels.lookup)
			{
				vars.apps[vars.levels.app]=[];
				vars.offset[vars.levels.app]=0;
				functions.loadlevels(function(){functions.load();});
			}
			else
			{
				$.each(vars.segments,function(key,values){
					var param=values;
					param.code=key;
					param.loaded=0;
					param.offset=0;
					param.records=[];
					if (param.app.length!=0) functions.loadsegments(param,function(res){functions.checkloaded();});
					else
					{
						param.records=[resp.properties[key].options.length];
						$.each(resp.properties[key].options,function(key,values){
							param.records[values.index]={display:values.label,field:values.label};
						});
						param.loaded=1;
					}
				});
				functions.checkloaded();
			}
		},function(error){});
		return event;
	});
	kintone.events.on(events.show,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return false;
		/* get query strings */
		var queries=$.queries();
		if (vars.config['date'] in queries) event.record[vars.config['date']].value=queries[vars.config['date']];
		if (vars.config['fromtime'] in queries) event.record[vars.config['fromtime']].value=queries[vars.config['fromtime']];
		if (vars.config['totime'] in queries) event.record[vars.config['totime']].value=queries[vars.config['totime']];
		vars.levels=JSON.parse(vars.config['levels']);
		vars.segments=JSON.parse(vars.config['segment']);
		if (vars.levels.lookup)
		{
			if (vars.levels.lookup in queries)
			{
				event.record[vars.levels.lookup].value=queries[vars.levels.lookup];
				event.record[vars.levels.lookup].lookup=true;
			}
		}
		else
		{
			$.each(vars.segments,function(key,values){
				if (key in queries)
				{
					event.record[key].value=queries[key];
					event.record[key].lookup=true;
				}
			});
		}
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
