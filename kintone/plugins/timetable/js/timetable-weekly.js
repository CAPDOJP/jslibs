/*
*--------------------------------------------------------------------
* jQuery-Plugin "timetable-weekly"
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
		cellposition:0,
		cellwidth:13,
		fromdate:new Date(),
		todate:new Date(),
		calendar:null,
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
		build:function(filter,columnindex,colorindex){
			var cells=[];
			var color=vars.colors[colorindex%vars.colors.length];
			var positions={
				min:vars.cellposition,
				max:vars.cellposition
			};
			if (filter.length!=0)
			{
				var date=new Date(filter[0][vars.config['date']].value.dateformat());
				for (var i=0;i<filter.length;i++)
				{
					/* create cell */
					var fromtime=new Date((date.format('Y-m-d')+'T'+filter[i][vars.config['fromtime']].value+':00+09:00').dateformat());
					var totime=new Date((date.format('Y-m-d')+'T'+filter[i][vars.config['totime']].value+':00+09:00').dateformat());
					var from=(fromtime.getHours())*parseInt(vars.config['scale'])+Math.floor(fromtime.getMinutes()/(60/parseInt(vars.config['scale'])));
					var to=(totime.getHours())*parseInt(vars.config['scale'])+Math.ceil(totime.getMinutes()/(60/parseInt(vars.config['scale'])))-1;
					var row=vars.table.contents.find('tr').eq(from);
					var position=positions.min;
					if (from<parseInt(vars.config['starthour'])*parseInt(vars.config['scale']))
					{
						from=parseInt(vars.config['starthour'])*parseInt(vars.config['scale']);
						row=vars.table.contents.find('tr').eq(from);
					}
					if (to<parseInt(vars.config['starthour'])*parseInt(vars.config['scale'])) continue;
					if (to>(parseInt(vars.config['endhour'])+1)*parseInt(vars.config['scale'])-1) to=(parseInt(vars.config['endhour'])+1)*parseInt(vars.config['scale'])-1;
					from=vars.table.contents.find('tr').eq(from).position().top;
					to=vars.table.contents.find('tr').eq(to).position().top+vars.table.contents.find('tr').eq(to).outerHeight(false);
					/* check cell appended */
					var appended=[];
					$.each(cells,function(index){
						var cell=$(this);
						var exists=false;
						if ($.data(cell[0],'from')<from && $.data(cell[0],'to')>to) exists=true;
						if ($.data(cell[0],'from')>from && $.data(cell[0],'from')<to) exists=true;
						if ($.data(cell[0],'to')>from && $.data(cell[0],'to')<to) exists=true;
						if (exists)
							if ($.inArray($.data(cell[0],'position'),appended)<0) appended.push($.data(cell[0],'position'));
					});
					/* adds 1 to the maximum value for the new position */
					for (var i2=positions.min;i2<positions.max+2;i2++) if ($.inArray(i2,appended)<0) {position=i2;break;}
					if (positions.max<position) positions.max=position;
					/* append cell */
					var cell=$('<div class="timetable-weekly-cell">');
					cell.css({
						'background-color':'#'+color,
						'cursor':'pointer',
						'height':(to-from)+'px',
						'left':(vars.cellwidth*position)+'px'
					})
					.on('click',function(){
						sessionStorage.setItem('fromdate_timetable-weekly',vars.fromdate.format('Y-m-d').dateformat());
						sessionStorage.setItem('todate_timetable-weekly',vars.todate.format('Y-m-d').dateformat());
						window.location.href=kintone.api.url('/k/', true).replace(/\.json/g,'')+kintone.app.getId()+'/show#record='+$(this).find('input#id').val()+'&mode=show';
					})
					.append($('<input type="hidden">').attr('id','id').val(filter[i]['$id'].value));
					cells.push(cell);
					row.find('td').eq(columnindex).append(cell);
					/* append balloon */
					var balloon=$('<div class="timetable-balloon">');
					var inner='';
					inner='';
					inner+='<p>';
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
					for (var i2=0;i2<vars.displays.length;i2++) inner+='<p>'+$.fieldvalue(filter[i][vars.displays[i2]])+'</p>';
					inner+='<p>'+filter[i][vars.config['fromtime']].value+' ～ '+filter[i][vars.config['totime']].value+'</p>';
					$('body').append(
						balloon.css({
							'z-index':(i+filter.length).toString()
						})
						.html(inner)
					);
					/* setup cell datas */
					$.data(cell[0],'balloon',balloon);
					$.data(cell[0],'columnindex',columnindex);
					$.data(cell[0],'from',from);
					$.data(cell[0],'position',position);
					$.data(cell[0],'to',to);
					/* mouse events */
					cell.on({
						'mouseenter':function(){$.data($(this)[0],'balloon').addClass('timetable-balloon-show');},
						'mouseleave':function(){$.data($(this)[0],'balloon').removeClass('timetable-balloon-show');}
					});
				}
				vars.cellposition=positions.max+1;
				vars.table.head.find('th').eq(columnindex).css({'min-width':vars.cellwidth*vars.cellposition+'px'});
			}
		},
		/* reload view */
		load:function(){
			/* after apprecords acquisition,rebuild view */
			vars.apps[kintone.app.getId()]=null;
			vars.offset[kintone.app.getId()]=0;
			functions.loaddatas(kintone.app.getId(),function(){
				var records=vars.apps[kintone.app.getId()];
				/* initialize cells */
				$('div.timetable-weekly-cell').remove();
				$('div.timetable-balloon').remove();
				$.each(vars.table.head.find('th'),function(index){
					$(this).css({'width':'auto'}).empty();
				})
				for (var i=0;i<7;i++)
				{
					vars.cellposition=0;
					vars.table.head.find('th').eq(i+1).append($('<p class="customview-p">').text(vars.fromdate.calc(i+' day').format('Y-m-d')))
					vars.table.head.find('th').eq(i+1).append($('<button class="customview-button time-button">').text('タイムテーブルを表示').on('click',function(){
						var query='';
						query+='view='+vars.config.datetimetable;
						query+='&'+vars.config['date']+'='+$(this).closest('th').find('p').text();
						sessionStorage.setItem('fromdate_timetable-weekly',vars.fromdate.format('Y-m-d').dateformat());
						sessionStorage.setItem('todate_timetable-weekly',vars.todate.format('Y-m-d').dateformat());
						window.location.href=kintone.api.url('/k/', true).replace(/\.json/g,'')+kintone.app.getId()+'/?'+query;
					}));
					if (vars.levels.lookup)
					{
						var added=[];
						for (var i2=0;i2<vars.apps[vars.levels.app].length;i2++)
						{
							var legend=$.fieldvalue(vars.apps[vars.levels.app][i2][vars.levels.relatedkey]);
							if (added.indexOf(legend)<0)
							{
								var filter=$.grep(records,function(item,index){
									var exists=0;
									if (item[vars.config['date']].value==vars.fromdate.calc(i+' day').format('Y-m-d')) exists++;
									if (item[vars.levels.lookup].value==legend) exists++;
									return exists==2;
								});
								/* rebuild view */
								functions.build(filter,i+1,i2);
							}
						}
					}
					else
					{
						var key=vars.segmentkeys[0];
						for (var i2=0;i2<vars.segments[key].records.length;i2++)
						{
							var filter=$.grep(records,function(item,index){
								var exists=0;
								if (item[vars.config['date']].value==vars.fromdate.calc(i+' day').format('Y-m-d')) exists++;
								if (item[key].value==vars.segments[key].records[i2].field) exists++;
								return exists==2;
							});
							/* rebuild view */
							functions.build(filter,i+1,i2);
						}
					}
				}
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
		if (event.viewId!=vars.config.weektimetable) return;
		/* initialize valiable */
		var container=$('div#timetable-container').css({'padding-bottom':'100px'});
		var feed=$('<div class="timetable-dayfeed">');
		var week=$('<span id="week" class="customview-span">');
		var button=$('<button id="datepick" class="customview-button calendar-button">');
		var prev=$('<button id="prev" class="customview-button prev-button">');
		var next=$('<button id="next" class="customview-button next-button">');
		vars.graphlegend=$('<div class="timetable-graphlegend">');
		/* append elements */
		feed.append(prev);
		feed.append(week);
		feed.append(button);
		feed.append(next);
		if ($('.timetable-dayfeed').size()) $('.timetable-dayfeed').remove();
		kintone.app.getHeaderMenuSpaceElement().appendChild(feed[0]);
		/* setup date value */
		if (sessionStorage.getItem('fromdate_timetable-weekly'))
		{
			vars.fromdate=new Date(sessionStorage.getItem('fromdate_timetable-weekly'));
			sessionStorage.removeItem('fromdate_timetable-weekly');
		}
		if (sessionStorage.getItem('todate_timetable-weekly'))
		{
			vars.todate=new Date(sessionStorage.getItem('todate_timetable-weekly'));
			sessionStorage.removeItem('todate_timetable-weekly');
		}
		vars.fromdate.setDate(vars.fromdate.getDate()+vars.fromdate.getDay()*-1);
		vars.todate=vars.fromdate.calc('6 day');
		week.text(vars.fromdate.format('Y-m-d')+' ～ '+vars.todate.format('Y-m-d'));
		/* day pickup button */
		vars.calendar=$('body').calendar({
			selected:function(target,value){
				vars.fromdate=new Date(value.dateformat());
				vars.fromdate.setDate(vars.fromdate.getDate()+vars.fromdate.getDay()*-1);
				vars.todate=vars.fromdate.calc('6 day');
				week.text(vars.fromdate.format('Y-m-d')+' ～ '+vars.todate.format('Y-m-d'));
				/* reload view */
				functions.load();
			}
		});
		button.on('click',function(){
			vars.calendar.show({activedate:vars.fromdate});
		});
		/* day feed button */
		$.each([prev,next],function(){
			$(this).on('click',function(){
				var days=($(this).attr('id')=='next')?7:-7;
				vars.fromdate=vars.fromdate.calc(days+' day');
				vars.todate=vars.todate.calc(days+' day');
				week.text(vars.fromdate.format('Y-m-d')+' ～ '+vars.todate.format('Y-m-d'));
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
		var head=$('<tr>').append($('<th>'));
		var template=$('<tr>').append($('<td>'));
		for (var i=0;i<7;i++)
		{
			head.append($('<th>'));
			template.append($('<td>'));
		}
		vars.table=$('<table id="timetable" class="customview-table timetable-weekly">').mergetable({
			container:container,
			head:head,
			template:template
		});
		/* insert row */
		for (var i=0;i<24;i++)
		{
			var hide=false;
			if (i<parseInt(vars.config['starthour'])) hide=true;
			if (i>parseInt(vars.config['endhour'])) hide=true;
			vars.table.insertrow(null,function(row){
				for (var i2=0;i2<parseInt(vars.config['scale'])-1;i2++)
				{
					vars.table.insertrow(row,function(row){
						row.find('td').eq(0).hide();
						if (hide) row.addClass('hide');
					});
				}
				row.find('td').eq(0).attr('rowspan',parseInt(vars.config['scale'])).text(i);
				if (hide) row.addClass('hide');
			});
		}
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
