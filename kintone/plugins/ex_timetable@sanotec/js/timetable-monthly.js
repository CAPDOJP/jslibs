/*
*--------------------------------------------------------------------
* jQuery-Plugin "timetable-monthly"
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
		fromdate:new Date(),
		todate:new Date(),
		graphlegend:null,
		table:null,
		apps:{},
		config:{},
		offset:{},
		fields:[],
		segments:[],
		colors:[
			'#FA8273',
			'#FFF07D',
			'#7DC87D',
			'#69B4C8',
			'#827DB9',
			'#E16EA5',
			'#FA7382',
			'#FFB46E',
			'#B4DC69',
			'#64C3AF',
			'#69A0C8',
			'#B473B4'
		]
	};
	var events={
		lists:[
			'app.record.index.show'
		]
	};
	var limit=500;
	var functions={
		/* rebuild view */
		build:function(filter,cell,colorindex){
			var color=vars.colors[colorindex%vars.colors.length];
			if (filter.length!=0)
			{
				for (var i=0;i<filter.length;i++)
				{
					/* append cell */
					var datecalc=functions.datecalc(new Date(filter[i][vars.config['fromtime']].value),new Date(filter[i][vars.config['totime']].value));
					var inner='';
					inner='';
					inner+='<p>';
					for (var i2=1;i2<vars.segments.length;i2++) inner+='>&nbsp;'+$.fieldvalue(filter[i][vars.segments[i2]])+'&nbsp;&nbsp;';
					inner+='</p>';
					inner+='<p>'+$.fieldvalue(filter[i][vars.config['display']])+'</p>';
					inner+='<p>'+datecalc.formatfrom+' ～ '+datecalc.formatto+'</p>';
					cell.append(
						$('<div class="timetable-monthly-cell">').css({
							'background-color':color,
							'cursor':'pointer'
						})
						.html(inner)
						.on('click',function(){
							window.location.href='https://'+$(location).attr('host')+'/k/'+kintone.app.getId()+'/show#record='+$(this).find('input#id').val()+'&mode=show';
						})
						.append($('<input type="hidden">').attr('id','id').val(filter[i]['$id'].value))
					);
				}
			}
		},
		datecalc:function(from,to,starthour){
			if (starthour) from=new Date(from.format('Y-m-d')+'T'+('0'+starthour).slice(-2)+':00:00+0900');
			var diff=to.getTime()-from.getTime();
			var fromtime={
				hour:from.getHours(),
				minute:from.getMinutes()
			};
			var totime={
				hour:fromtime.hour+Math.floor((fromtime.minute+diff/(1000*60))/60),
				minute:(fromtime.minute+diff/(1000*60))%60
			};
			var values={
				diffhours:Math.ceil((fromtime.minute+diff/(1000*60))/60),
				from:fromtime,
				to:totime,
				formatfrom:('0'+fromtime.hour).slice(-2)+':'+('0'+fromtime.minute).slice(-2),
				formatto:('0'+totime.hour).slice(-2)+':'+('0'+totime.minute).slice(-2)
			};
			return values;
		},
		/* reload view */
		load:function(){
			/* after apprecords acquisition,rebuild view */
			vars.apps[kintone.app.getId()]=null;
			vars.offset[kintone.app.getId()]=0;
			functions.loaddatas(kintone.app.getId(),function(){
				var records=vars.apps[kintone.app.getId()];
				var segmentcode=vars.segments[0];
				var segments=[];
				/* create graph legend */
				vars.graphlegend.empty();
				$.each(records,function(index){
					if (segments.indexOf(records[index][segmentcode].value)<0)
					{
						var color=vars.colors[segments.length%vars.colors.length];
						vars.graphlegend
						.append($('<span class="customview-span timetable-graphlegend-color">').css({'background-color':color}))
						.append($('<span class="customview-span timetable-graphlegend-title">').text(records[index][segmentcode].value));
						segments.push(records[index][segmentcode].value);
					}
				});
				/* initialize rows */
				vars.table.contents.find('tr').show();
				/* initialize cells */
				vars.table.contents.find('td').each(function(index){
					var display=index-vars.fromdate.getDay();
					var day=vars.fromdate.calc(display.toString()+' day');
					var cell=$(this);
					/* not process less than one day this month */
					if (display<0) {cell.empty();return;}
					/* not processing beyond the next month 1 day */
					if (day.format('Y-m')!=vars.fromdate.format('Y-m')) {cell.empty();return;}
					cell.empty();
					cell.append($('<div class="timetable-monthly-days">')
						.append($('<span>').text(display+1))
						.append($('<button class="customview-button time-button">').text('タイムテーブルを表示').on('click',function(){
							var query='';
							query+='view='+vars.config.datetimetable;
							query+='&'+vars.config['date']+'='+day.format('Y-m-d');
							window.location.href='https://'+$(location).attr('host')+'/k/'+kintone.app.getId()+'/?'+query;
						}))
					);
					switch ((index+1)%7)
					{
						case 0:
							//saturday's style
							cell.find('span').css({'color':'#69B4C8'});
							break;
						case 1:
							//sunday's style
							cell.find('span').css({'color':'#FA8273'});
							break;
					}
					/* place the segment data */
					for (var i=0;i<segments.length;i++)
					{
						var filter=$.grep(records,function(item,index){
							var exists=0;
							var date=new Date(item[vars.config['fromtime']].value);
							if (date.format('Y-m-d')==day.format('Y-m-d')) exists++;
							if (item[segmentcode].value==segments[i]) exists++;
							return exists==2;
						});
						/* rebuild view */
						functions.build(filter,cell,i);
					}
				});
				/* check no element rows */
				$.each(vars.table.contents.find('tr'),function(index,values){
				    if (!$(this).find('div').size()) $(this).hide();
				})
			},function(error){});
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
			query+=vars.config['fromtime']+'>"'+vars.fromdate.calc('-1 day').format('Y-m-d')+'T23:59:59+0900"';
			query+=' and '+vars.config['fromtime']+'<"'+vars.todate.calc('1 day').format('Y-m-d')+'T00:00:00+0900"';
			sort=' order by ';
			sort+=vars.config['fromtime']+' asc,';
			for (var i=0;i<vars.segments.length;i++) sort+=vars.segments[i]+' asc,';
			sort=sort.replace(/,$/g,'');
			sort+=' limit '+limit.toString()+' offset '+vars.offset[appkey].toString();
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
		if (event.viewId!=vars.config.monthtimetable) return;
		/* initialize valiable */
		var container=$('div#timetable-container');
		var month=$('<span id="month" class="customview-span">');
		var prev=$('<button id="prev" class="customview-button prev-button">');
		var next=$('<button id="next" class="customview-button next-button">');
		vars.graphlegend=$('<div class="timetable-graphlegend">');
		/* append elements */
		kintone.app.getHeaderMenuSpaceElement().innerHTML='';
		kintone.app.getHeaderMenuSpaceElement().appendChild(prev[0]);
		kintone.app.getHeaderMenuSpaceElement().appendChild(month[0]);
		kintone.app.getHeaderMenuSpaceElement().appendChild(next[0]);
		/* setup date value */
		vars.fromdate=vars.fromdate.calc('first-of-month');
		vars.todate=vars.fromdate.calc('1 month').calc('-1 day');
		month.text(vars.fromdate.format('Y-m-d')+' ～ '+vars.todate.format('Y-m-d'));
		/* day feed button */
		$.each([prev,next],function(){
			$(this).on('click',function(){
				var months=($(this).attr('id')=='next')?1:-1;
				vars.fromdate=vars.fromdate.calc(months+' month');
				vars.todate=vars.fromdate.calc('1 month').calc('-1 day');
				month.text(vars.fromdate.format('Y-m-d')+' ～ '+vars.todate.format('Y-m-d'));
				/* reload view */
				functions.load();
			});
		});
		/* setup segments value */
		vars.segments=vars.config['segment'].split(',');
		/* create table */
		container.empty().append(vars.graphlegend.empty());
		var head=$('<tr>');
		var template=$('<tr>');
		var week=['日','月','火','水','木','金','土'];
		for (var i=0;i<7;i++)
		{
			head.append($('<th>').text(week[i]));
			template.append($('<td>'));
		}
		vars.table=$('<table id="timetable" class="customview-table timetable-monthly">').mergetable({
			container:container,
			head:head,
			template:template
		});
		/* insert row */
		for (var i=0;i<8;i++) vars.table.insertrow();
		/* get fields of app */
		kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
			vars.fields=['$id'];
			$.each(resp.properties,function(key,values){vars.fields.push(values.code);});
			/* reload view */
			functions.load();
		},function(error){});
		return;
	});
})(jQuery,kintone.$PLUGIN_ID);
