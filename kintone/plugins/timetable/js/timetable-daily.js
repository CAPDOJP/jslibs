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
		offset:{},
		segments:{},
		colors:[],
		fields:[],
		segmentkeys:[]
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
			var color=vars.colors[colorindex%vars.colors.length];
			/* insert row */
			vars.table.insertrow(null,function(row){
				var baserow=row;
				var index=0;
				var inner='';
				$.each(heads,function(key,values){
					inner='';
					inner+='<p class="customview-p">'+values.display+'</p>';
					inner+='<input type="hidden" id="segment" value="'+values.field+'" />';
					baserow.find('td').eq(index).html(inner);
					index++;
				});
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
			vars.table.mergecell(
				row.find('td').eq(from),
				from,
				to
			);
			/* cell value switching */
			row.find('td').eq(from).append($('<p>').addClass('timetable-daily-merge-p').html($.fieldvalue(filter[vars.config['display']])));
			row.find('td').eq(from).append($('<span>').addClass('timetable-daily-merge-span').css({'background-color':'#'+color}));
			$.each(filter,function(key,values){
				if (values!=null)
					if (values.value!=null)
						row.find('td').eq(from).append($('<input type="hidden">').attr('id',key).val(values.value));
			})
		},
		/* reload view */
		load:function(){
			/* after apprecords acquisition,rebuild view */
			vars.apps[kintone.app.getId()]=null;
			vars.offset[kintone.app.getId()]=0;
			functions.loaddatas(kintone.app.getId(),function(){
				var records=vars.apps[kintone.app.getId()];
				var heads={
					index:0,
					prev:1,
					total:1,
					values:[]
				};
				/* create rowheads */
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
				/* initialize table */
				vars.table.clearrows();
				if (heads.values.length!=0)
				{
					/* place the segment data */
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
				else
				{
					var filter=$.grep(records,function(item,index){return true;});
					/* rebuild view */
					functions.build(filter,0);
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
				$.each($('.timetable-daily-merge'),function(){
					$(this).css({'padding-top':$(this).find('.timetable-daily-merge-p').outerHeight(true).toString()+'px'});
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
				if (vars.apps[appkey]==null) vars.apps[appkey]=resp.records;
				else Array.prototype.push.apply(vars.apps[appkey],resp.records);
				vars.offset[appkey]+=limit;
				if (resp.records.length==limit) functions.loaddatas(appkey,callback);
				else callback();
			},function(error){});
		},
		/* reload datas of segment */
		loadsegments:function(param,callback){
			var body={
				app:param.app,
				query:'order by '+param.field+' '+param.sort+' limit '+limit.toString()+' offset '+param.offset.toString()
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
		var container=$('div#timetable-container');
		var feed=$('<div class="timetable-dayfeed">');
		var date=$('<span id="date" class="customview-span">');
		var button=$('<button id="datepick" class="customview-button calendar-button">');
		var prev=$('<button id="prev" class="customview-button prev-button">');
		var next=$('<button id="next" class="customview-button next-button">');
		var guidefrom=$('<div class="guidefrom">');
		var guideto=$('<div class="guideto">');
		/* append elements */
		feed.append(prev);
		feed.append(date);
		feed.append(button);
		feed.append(next);
		kintone.app.getHeaderMenuSpaceElement().innerHTML='';
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
		date.text(vars.date.format('Y-m-d'));
		/* day pickup button */
		vars.calendar=$('body').calendar({
			selected:function(target,value){
				vars.date=new Date(value.dateformat());
				date.text(value);
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
				date.text(vars.date.format('Y-m-d'));
				/* reload view */
				functions.load();
			});
		});
		/* setup colors value */
		vars.colors=vars.config['segmentcolors'].split(',');
		/* setup segments value */
		vars.segments=JSON.parse(vars.config['segment']);
		vars.segmentkeys=Object.keys(vars.segments);
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
			merge:true,
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
				for (var i=0;i<vars.segmentkeys.length;i++) query+='&'+vars.segmentkeys[i]+'='+caller.contents.find('tr').eq(rowindex).find('td').eq(i).find('input#segment').val();
				window.location.href='https://'+$(location).attr('host')+'/k/'+kintone.app.getId()+'/edit?'+query;
			},
			unmergetrigger:function(caller,cell,rowindex,cellindex){
				window.location.href='https://'+$(location).attr('host')+'/k/'+kintone.app.getId()+'/show#record='+cell.find('input#\\$id').val()+'&mode=show';
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
			$.each(resp.properties,function(key,values){
				vars.fields.push(values.code);
			});
			/* get datas of segment */
			$.each(vars.segments,function(key,values){
				var param=values;
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
		},function(error){});
		return;
	});
	kintone.events.on(events.show,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return false;
		/* get query strings */
		var queries=$.queries();
		if (vars.config['date'] in queries) event.record[vars.config['date']].value=queries[vars.config['date']];
		if (vars.config['fromtime'] in queries) event.record[vars.config['fromtime']].value=queries[vars.config['fromtime']];
		if (vars.config['totime'] in queries) event.record[vars.config['totime']].value=queries[vars.config['totime']];
		vars.segments=JSON.parse(vars.config['segment']);
		$.each(vars.segments,function(key,values){
			if (key in queries)
			{
				event.record[key].value=queries[key];
				event.record[key].lookup=true;
			}
		});
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
