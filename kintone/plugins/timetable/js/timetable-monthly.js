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
					var inner='';
					inner='';
					inner+='<p class="timetable-tooltip">';
					if (vars.levels.lookup)
					{
						var levels=$.grep(vars.apps[vars.levels.app],function(item,index){
							return item[vars.levels.relatedkey].value==filter[i][vars.levels.lookup].value;
						});
						if (levels.length!=0)
							for (var i2=0;i2<vars.segmentkeys.length;i2++) inner+='<span>'+$.fieldvalue(levels[0][vars.segmentkeys[i2]])+'</span>';
					}
					else
					{
						$.each(vars.segments,function(key,values){
							if (key!=vars.segmentkeys[0])
								for (var i2=0;i2<values.records.length;i2++)
									if (filter[i][key].value==values.records[i2].field) inner+='<span>'+values.records[i2].display+'</span>';
						});
					}
					inner+='</p>';
					for (var i2=0;i2<vars.displays.length;i2++) inner+='<p class="timetable-tooltip">'+$.fieldvalue(filter[i][vars.displays[i2]])+'</p>';
					inner+='<p class="timetable-tooltip">'+filter[i][vars.config['fromtime']].value+' ～ '+filter[i][vars.config['totime']].value+'</p>';
					cell.append(
						$('<div class="timetable-monthly-cell">').css({
							'background-color':'#'+color,
							'cursor':'pointer'
						})
						.html(inner)
						.on('click',function(){
							sessionStorage.setItem('fromdate_timetable-monthly',vars.fromdate.format('Y-m-d').dateformat());
							sessionStorage.setItem('todate_timetable-monthly',vars.todate.format('Y-m-d').dateformat());
							window.location.href=kintone.api.url('/k/', true).replace(/\.json/g,'')+kintone.app.getId()+'/show#record='+$(this).find('input#id').val()+'&mode=show';
						})
						.append($('<input type="hidden">').attr('id','id').val(filter[i]['$id'].value))
					);
				}
			}
		},
		/* reload view */
		load:function(){
			/* after apprecords acquisition,rebuild view */
			vars.apps[kintone.app.getId()]=null;
			vars.offset[kintone.app.getId()]=0;
			functions.loaddatas(kintone.app.getId(),function(){
				var records=vars.apps[kintone.app.getId()];
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
							sessionStorage.setItem('fromdate_timetable-monthly',vars.fromdate.format('Y-m-d').dateformat());
							sessionStorage.setItem('todate_timetable-monthly',vars.todate.format('Y-m-d').dateformat());
							window.location.href=kintone.api.url('/k/', true).replace(/\.json/g,'')+kintone.app.getId()+'/?'+query;
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
					if (vars.levels.lookup)
					{
						var added=[];
						for (var i=0;i<vars.apps[vars.levels.app].length;i++)
						{
							var legend=$.fieldvalue(vars.apps[vars.levels.app][i][vars.levels.relatedkey]);
							if (added.indexOf(legend)<0)
							{
								var filter=$.grep(records,function(item,index){
									var exists=0;
									if (item[vars.config['date']].value==day.format('Y-m-d')) exists++;
									if (item[vars.levels.lookup].value==legend) exists++;
									return exists==2;
								});
								/* rebuild view */
								functions.build(filter,cell,i);
							}
						}
					}
					else
					{
						var key=vars.segmentkeys[0];
						for (var i=0;i<vars.segments[key].records.length;i++)
						{
							var filter=$.grep(records,function(item,index){
								var exists=0;
								if (item[vars.config['date']].value==day.format('Y-m-d')) exists++;
								if (item[key].value==vars.segments[key].records[i].field) exists++;
								return exists==2;
							});
							/* rebuild view */
							functions.build(filter,cell,i);
						}
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
			query+=vars.config['date']+'>"'+vars.fromdate.calc('-1 day').format('Y-m-d')+'"';
			query+=' and '+vars.config['date']+'<"'+vars.todate.calc('1 day').format('Y-m-d')+'"';
			sort=' order by ';
			sort+=vars.config['date']+' asc,';
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
			if (loaded==total)
			{
				/* append graph legend */
				var key=vars.segmentkeys[0];
				for (var i=0;i<vars.segments[key].records.length;i++)
				{
					var color=vars.colors[i%vars.colors.length];
					vars.graphlegend
					.append($('<span class="customview-span timetable-graphlegend-color">').css({'background-color':'#'+color}))
					.append($('<span class="customview-span timetable-graphlegend-title">').text(vars.segments[key].records[i].display));
				}
				/* reload view */
				functions.load();
			}
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
		var feed=$('<div class="timetable-dayfeed">');
		var month=$('<span id="month" class="customview-span">');
		var prev=$('<button id="prev" class="customview-button prev-button">');
		var next=$('<button id="next" class="customview-button next-button">');
		vars.graphlegend=$('<div class="timetable-graphlegend">');
		/* append elements */
		feed.append(prev);
		feed.append(month);
		feed.append(next);
		if ($('.timetable-dayfeed').size()) $('.timetable-dayfeed').remove();
		kintone.app.getHeaderMenuSpaceElement().appendChild(feed[0]);
		/* setup date value */
		if (sessionStorage.getItem('fromdate_timetable-monthly'))
		{
			vars.fromdate=new Date(sessionStorage.getItem('fromdate_timetable-monthly'));
			sessionStorage.removeItem('fromdate_timetable-monthly');
		}
		if (sessionStorage.getItem('todate_timetable-monthly'))
		{
			vars.todate=new Date(sessionStorage.getItem('todate_timetable-monthly'));
			sessionStorage.removeItem('todate_timetable-monthly');
		}
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
})(jQuery,kintone.$PLUGIN_ID);
