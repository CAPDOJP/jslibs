/*
*--------------------------------------------------------------------
* jQuery-Plugin "timetable-daily"
* Version: 1.0
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
		config:{},
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
	var functions={
		/* rebuild view */
		build:function(filter,segment,segmentname){
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
				if (vars.config['route'].length!=0)
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
						var from=(fromtime.getHours())*2+Math.floor(fromtime.getMinutes()/30);
						var to=(totime.getHours())*2+Math.ceil(totime.getMinutes()/30)-1;
						var fromindex=0;
						var toindex=0;
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
							});
						}
						else functions.mergeaftervalue(mergerow,fromindex,toindex,filter[i]);
					}
				}
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
			var inner='';
			inner+='<p class="customview-p">'+filter[vars.config['display']].value+'</p>';
			$.each(filter,function(key,values){
				if (values!=null)
					if (values.value!=null)
						inner+='<input type="hidden" id="'+key+'" value="'+values.value+'" />';
			})
			row.find('td').eq(from).html(inner);
		},
		/* reload view */
		load:function(){
			/* after apprecords acquisition,rebuild view */
			var sort='';
			var body={
				app:kintone.app.getId(),
				query:vars.config['date']+'="'+vars.date.format('Y-m-d')+'"',
				fields:vars.fields
			};
			sort=' order by ';
			sort+=(vars.config['segment'].length!=0)?vars.config['segment']+' asc,':'';
			sort+=vars.config['fromtime']+' asc';
			body.query+=sort;
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				var records=resp.records;
				/* initialize table */
				vars.table.clearrows();
				if (vars.config['segment'].length!=0)
				{
					/* place the segment data */
					$.each(vars.segment,function(index,values){
						var filter=$.grep(records,function(item,index){return item[vars.config['segment']].value==values[vars.config['segmentappfield']].value;});
						/* rebuild view */
						functions.build(filter,values[vars.config['segmentappfield']].value,values[vars.config['segmentdisplay']].value);
					});
				}
				else
				{
					var filter=$.grep(records,function(item,index){return true;});
					/* rebuild view */
					functions.build(filter,'','');
				}
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
		/* initialize valiable */
		var container=$('div#timetable-container');
		var date=$('<span id="date" class="customview-span">');
		var button=$('<button id="datepick" class="customview-button calendar-button">');
		var prev=$('<button id="prev" class="customview-button prev-button">');
		var next=$('<button id="next" class="customview-button next-button">');
		/* append elements */
		kintone.app.getHeaderMenuSpaceElement().appendChild(prev[0]);
		kintone.app.getHeaderMenuSpaceElement().appendChild(date[0]);
		kintone.app.getHeaderMenuSpaceElement().appendChild(next[0]);
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
		    vars.calendar.show({active:vars.date});
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
		/* create table */
		container.empty();
		var head=$('<tr></tr><tr></tr>');
		var template=$('<tr>');
		if (vars.config['route']=='1' || vars.config['segment'].length!=0)
		{
			head.eq(0).append($('<th>'));
			head.eq(1).append($('<th>'));
			template.append($('<td>'));
		}
		for (var i=0;i<24;i++)
		{
			head.eq(0).append($('<th colspan="2">').text(i));
			head.eq(1).append($('<th class="timetable-daily-cell"></th><th class="timetable-daily-cell"></th>'));
			template.append($('<td></td><td></td>'));
		}
		vars.table=$('<table id="timetable" class="customview-table timetable-daily">').mergetable({
			container:container,
			head:head,
			template:template,
			merge:true,
			mergeexclude:((vars.config['route']=='1' || vars.config['segment'].length!=0)?[0]:[]),
			mergeclass:'timetable-daily-merge',
			mergetrigger:function(caller,cell,rowindex,cellfrom,cellto){
				var query='';
				var fromhour=Math.floor((caller.cellindex(cell.parent(),cellfrom)-1)/2);
				var tohour=Math.floor(caller.cellindex(cell.parent(),cellto)/2);
				var fromminute=(caller.cellindex(cell.parent(),cellfrom)-1)%2*30;
				var tominute=caller.cellindex(cell.parent(),cellto)%2*30;
				query+=vars.config['date']+'='+vars.date.format('Y-m-d');
				query+='&'+vars.config['fromtime']+'='+fromhour.toString().lpad('0',2)+':'+fromminute.toString().lpad('0',2);
				query+='&'+vars.config['totime']+'='+tohour.toString().lpad('0',2)+':'+tominute.toString().lpad('0',2);
				if (vars.config['segment'].length!=0)
					query+='&'+vars.config['segment']+'='+caller.contents.find('tr').eq(rowindex).find('td').eq(0).find('input#segment').val();
				window.location.href='https://'+$(location).attr('host')+'/k/'+kintone.app.getId()+'/edit?'+query;
			},
			unmergetrigger:function(caller,cell,rowindex,cellindex){
				window.location.href='https://'+$(location).attr('host')+'/k/'+kintone.app.getId()+'/show#record='+cell.find('input#\\$id').val()+'&mode=show';
			}
		});
		/* create routemap box */
		if (vars.config['route']=='1') vars.route=$('body').routemap(vars.config['apikey']);
		/* get fields of app */
		kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
			vars.fields=['$id'];
			$.each(resp.properties,function(key,values){
				vars.fields.push(values.code);
			});
			/* get datas of segment */
			if (vars.config['segment'].length!=0)
			{
				kintone.api(kintone.api.url('/k/v1/records',true),'GET',{app:vars.config['segmentapp']},function(resp){
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
