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
		segment:null,
		table:null,
		apps:{},
		config:{},
		offset:{},
		colors:[],
		fields:[]
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
		build:function(filter,segment,segmentname,colorindex){
			var color=vars.colors[colorindex%vars.colors.length];
			/* insert row */
			vars.table.insertrow(null,function(row){
				var baserow=row;
				var inner='';
				if (vars.config['segment'].length!=0)
				{
					inner+='<p class="customview-p">'+segmentname+'</p>';
					inner+='<input type="hidden" id="segment" value="'+segment+'" />';
					baserow.find('td').eq(0).html(inner);
				}
				if (vars.config['route']=='1')
				{
					baserow.find('td').eq(0).append($('<button class="customview-button compass-button">').text('地図を表示').on('click',function(){
						/* display routemap */
						var markers=[];
						var rowindex=vars.table.contents.find('tr').index($(this).closest('tr'));
						var rowspan=(parseInt('0'+baserow.find('td').eq(0).attr('rowspan'))!=0)?parseInt('0'+baserow.find('td').eq(0).attr('rowspan')):1;
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
						var fromtime=new Date(vars.date.format('Y-m-d')+'T'+filter[i][vars.config['fromtime']].value+':00+09:00');
						var totime=new Date(vars.date.format('Y-m-d')+'T'+filter[i][vars.config['totime']].value+':00+09:00');
						var from=(fromtime.getHours())*parseInt(vars.config['scale'])+Math.floor(fromtime.getMinutes()/(60/parseInt(vars.config['scale'])));
						var to=(totime.getHours())*parseInt(vars.config['scale'])+Math.ceil(totime.getMinutes()/(60/parseInt(vars.config['scale'])))-1;
						var fromindex=0;
						var toindex=0;
						if (from<parseInt(vars.config['starthour'])*parseInt(vars.config['scale'])) from=parseInt(vars.config['starthour'])*parseInt(vars.config['scale']);
						if (to<parseInt(vars.config['starthour'])*parseInt(vars.config['scale'])) continue;
						if (to>(parseInt(vars.config['endhour'])+1)*parseInt(vars.config['scale'])-1) to=(parseInt(vars.config['endhour'])+1)*parseInt(vars.config['scale'])-1;
						if (vars.config['route']=='1' || vars.config['segment'].length!=0)
						{
							from++;
							to++;
						}
						/* check cell merged */
						var isinsertrow=true;
						var mergerow=baserow;
						var rowindex=vars.table.contents.find('tr').index(baserow);
						var rowspan=(parseInt('0'+baserow.find('td').eq(0).attr('rowspan'))!=0)?parseInt('0'+baserow.find('td').eq(0).attr('rowspan')):1;
						for (var i2=rowindex;i2<rowindex+rowspan;i2++)
						{
							mergerow=vars.table.contents.find('tr').eq(i2);
							fromindex=vars.table.mergecellindex(mergerow,from);
							toindex=vars.table.mergecellindex(mergerow,to);
							if (!mergerow.find('td').eq(fromindex).hasClass('timetable-daily-merge') && !mergerow.find('td').eq(toindex).hasClass('timetable-daily-merge')) {isinsertrow=false;break;}
						}
						/* merge cell */
						if (isinsertrow)
						{
							vars.table.insertrow(vars.table.contents.find('tr').eq(rowindex+rowspan-1),function(row){
								mergerow=row;
								fromindex=vars.table.mergecellindex(mergerow,from);
								toindex=vars.table.mergecellindex(mergerow,to);
								functions.mergeaftervalue(mergerow,fromindex,toindex,filter[i]);
								rowspan++;
								/* check row merged */
								if (vars.config['route']=='1' || vars.config['segment'].length!=0)
								{
									baserow.find('td').eq(0).attr('rowspan',rowspan);
							        mergerow.find('td').eq(0).html(baserow.find('td').eq(0).html()).hide();
								}
								/* setup merge class */
								row.find('.timetable-daily-merge-span').css({'background-color':'#'+color});
							});
						}
						else functions.mergeaftervalue(mergerow,fromindex,toindex,filter[i]);
					}
				}
				/* setup merge class */
				row.find('.timetable-daily-merge-span').css({'background-color':'#'+color});
			});
		},
		/* setup merge cell value */
		mergeaftervalue:function(row,from,to,filter){
			vars.table.mergecell(
				row.find('td').eq(from),
				from,
				to
			);
			/* cell value switching */
			row.find('td').eq(from).append($('<p>').addClass('timetable-daily-merge-p').html($.fieldvalue(filter[vars.config['display']])));
			row.find('td').eq(from).append($('<span>').addClass('timetable-daily-merge-span'));
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
				/* initialize table */
				vars.table.clearrows();
				if (vars.config['segment'].length!=0)
				{
					/* place the segment data */
					$.each(vars.segment,function(index,values){
						var filter=$.grep(records,function(item,index){return item[vars.config['segment']].value==values[vars.config['segmentappfield']].value;});
						/* rebuild view */
						functions.build(filter,values[vars.config['segmentappfield']].value,values[vars.config['segmentdisplay']].value,index);
					});
				}
				else
				{
					var filter=$.grep(records,function(item,index){return true;});
					/* rebuild view */
					functions.build(filter,'','',0);
				}
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
			sort+=(vars.config['segment'].length!=0)?vars.config['segment']+' asc,':'';
			sort+=vars.config['fromtime']+' asc limit '+limit.toString()+' offset '+vars.offset[appkey].toString();
			body.query+=query+sort;
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
	        	if (vars.apps[appkey]==null) vars.apps[appkey]=resp.records;
	        	else Array.prototype.push.apply(vars.apps[appkey],resp.records);
				vars.offset[appkey]+=limit;
				if (resp.records.length==limit) functions.loaddatas(appkey,callback);
				else callback();
			},function(error){});
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
		if (vars.config['date'] in queries) vars.date=new Date(queries[vars.config['date']]);
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
				vars.date=new Date(value);
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
		/* create table */
		container.empty();
		var head=$('<tr></tr><tr></tr>');
		var template=$('<tr>');
		var spacer=$('<span>');
		if (vars.config['route']=='1' || vars.config['segment'].length!=0)
		{
			head.eq(0).append($('<th class="timetable-daily-cellhead">'));
			head.eq(1).append($('<th class="timetable-daily-cellhead">'));
			template.append($('<td class="timetable-daily-cellhead">'));
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
			mergeexclude:((vars.config['route']=='1' || vars.config['segment'].length!=0)?[0]:[]),
			mergeclass:'timetable-daily-merge',
			mergetrigger:function(caller,cell,rowindex,cellfrom,cellto){
				var query='';
				var fromhour=Math.floor((caller.cellindex(cell.parent(),cellfrom)-1)/parseInt(vars.config['scale']));
				var tohour=Math.floor(caller.cellindex(cell.parent(),cellto)/parseInt(vars.config['scale']));
				var fromminute=(caller.cellindex(cell.parent(),cellfrom)-1)%parseInt(vars.config['scale'])*(60/parseInt(vars.config['scale']));
				var tominute=caller.cellindex(cell.parent(),cellto)%parseInt(vars.config['scale'])*(60/parseInt(vars.config['scale']));
				if (tohour=='24' && tominute=='00')
				{
					tohour='23';
					tominute='59';
				}
				query+=vars.config['date']+'='+vars.date.format('Y-m-d');
				query+='&'+vars.config['fromtime']+'='+fromhour.toString().lpad('0',2)+':'+fromminute.toString().lpad('0',2);
				query+='&'+vars.config['totime']+'='+tohour.toString().lpad('0',2)+':'+tominute.toString().lpad('0',2);
				if (vars.config['segment'].length!=0)
					query+='&'+vars.config['segment']+'='+caller.contents.find('tr').eq(rowindex).find('td').eq(0).find('input#segment').val();
				window.location.href='https://'+$(location).attr('host')+'/k/'+kintone.app.getId()+'/edit?'+query;
			},
			unmergetrigger:function(caller,cell,rowindex,cellindex){
				window.location.href='https://'+$(location).attr('host')+'/k/'+kintone.app.getId()+'/show#record='+cell.find('input#\\$id').val()+'&mode=show';
			},
			callback:{
				guidestart:function(e,caller,table,rowindex,cellindex){
					if (rowindex==null) {guidefrom.hide();return;}
					var row=table.find('tbody').find('tr').eq(rowindex);
					var hour=Math.floor((caller.cellindex(row,cellindex)-1)/parseInt(vars.config['scale']));
					var minute=(caller.cellindex(row,cellindex)-1)%parseInt(vars.config['scale'])*(60/parseInt(vars.config['scale']));
					guidefrom.text(hour.toString().lpad('0',2)+':'+minute.toString().lpad('0',2)).show().css({
				      'left':(row.find('td').eq(cellindex).offset().left-$(window).scrollLeft()).toString()+'px',
				      'top':(row.offset().top-$(window).scrollTop()-guidefrom.outerHeight(true)).toString()+'px'
					});
				},
				guide:function(e,caller,table,rowindex,cellfrom,cellto){
					var row=table.find('tbody').find('tr').eq(rowindex);
					var fromhour=Math.floor((caller.cellindex(row,cellfrom)-1)/parseInt(vars.config['scale']));
					var tohour=Math.floor(caller.cellindex(row,cellto)/parseInt(vars.config['scale']));
					var fromminute=(caller.cellindex(row,cellfrom)-1)%parseInt(vars.config['scale'])*(60/parseInt(vars.config['scale']));
					var tominute=caller.cellindex(row,cellto)%parseInt(vars.config['scale'])*(60/parseInt(vars.config['scale']));
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
			if (vars.config['segment'].length!=0)
			{
				kintone.api(kintone.api.url('/k/v1/records',true),'GET',{app:vars.config['segmentapp'],query:'order by '+vars.config['segmentappfield']+' asc'},function(resp){
					vars.segment=resp.records;
					/* reload view */
					functions.load();
				},function(error){});
			}
			else functions.load();
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
		if (vars.config['segment'].length!=0)
			if (vars.config['segment'] in queries)
			{
				event.record[vars.config['segment']].value=queries[vars.config['segment']];
				event.record[vars.config['segment']].lookup=true;
			}
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
