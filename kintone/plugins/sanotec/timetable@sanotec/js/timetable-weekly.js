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
		offset:{},
		colors:[],
		fields:[],
		segments:[]
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
				for (var i=0;i<filter.length;i++)
				{
					/* create cell */
					var datecalc=$.timetabledatecalc(new Date(filter[i][vars.config['fromtime']].value.dateformat()),new Date(filter[i][vars.config['totime']].value.dateformat()));
					if (datecalc.to.hour<parseInt(vars.config['starthour'])) continue;
					var from=(datecalc.from.hour-parseInt(vars.config['starthour']))*parseInt(vars.config['scale'])+Math.floor(datecalc.from.minute/(60/parseInt(vars.config['scale'])));
					var to=(datecalc.to.hour-parseInt(vars.config['starthour']))*parseInt(vars.config['scale'])+Math.ceil(datecalc.to.minute/(60/parseInt(vars.config['scale'])))-1;
					var row=vars.table.contents.find('tr').eq(from);
					var position=positions.min;
					if (from<0)
					{
						from=0;
						row=vars.table.contents.find('tr').eq(from);
					}
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
						window.location.href='https://'+$(location).attr('host')+'/k/'+kintone.app.getId()+'/show#record='+$(this).find('input#id').val()+'&mode=show';
					})
					.append($('<input type="hidden">').attr('id','id').val(filter[i]['$id'].value));
					cells.push(cell);
					row.find('td').eq(columnindex).append(cell);
					/* append balloon */
					var balloon=$('<div class="timetable-weekly-balloon">');
					var inner='';
					inner='';
					inner+='<p class="timetable-tooltip">';
					for (var i2=1;i2<vars.segments.length;i2++) inner+='<span>'+$.fieldvalue(filter[i][vars.segments[i2]])+'</span>';
					inner+='</p>';
					inner+='<p class="timetable-tooltip">'+$.fieldvalue(filter[i][vars.config['display']])+'</p>';
					inner+='<p>'+datecalc.formatfrom+' ～ '+datecalc.formatto+'</p>';
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
						'mouseenter':function(){$.data($(this)[0],'balloon').addClass('timetable-weekly-balloon-show');},
						'mouseleave':function(){$.data($(this)[0],'balloon').removeClass('timetable-weekly-balloon-show');}
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
				var legendcode=vars.segments[0];
				var legends=[];
				var datecalc={};
				var rows=0;
				/* create graph legend */
				vars.graphlegend.empty();
				$.each(records,function(index){
					if (legends.indexOf(records[index][legendcode].value)<0)
					{
						var color=vars.colors[legends.length%vars.colors.length];
						vars.graphlegend
						.append($('<span class="customview-span timetable-graphlegend-color">').css({'background-color':'#'+color}))
						.append($('<span class="customview-span timetable-graphlegend-title">').text(records[index][legendcode].value));
						legends.push(records[index][legendcode].value);
					}
					datecalc=$.timetabledatecalc(new Date(records[index][vars.config['fromtime']].value.dateformat()),new Date(records[index][vars.config['totime']].value.dateformat()),vars.config['starthour']);
					if (rows<datecalc.diffhours) rows=datecalc.diffhours;
				});
				/* insert row */
				vars.table.clearrows();
				for (var i=0;i<rows;i++)
				{
					vars.table.insertrow(null,function(row){
						for (var i2=0;i2<parseInt(vars.config['scale'])-1;i2++) vars.table.insertrow(row,function(row){row.find('td').eq(0).hide();});
						row.find('td').eq(0).attr('rowspan',parseInt(vars.config['scale'])).text((i+parseInt(vars.config['starthour']))%24);
					});
				}
				/* initialize cells */
				$('div.timetable-weekly-cell').remove();
				$('div.timetable-weekly-balloon').remove();
				$.each(vars.table.head.find('th'),function(index){$(this).css({'width':'auto'}).empty();})
				for (var i=0;i<7;i++)
				{
					vars.cellposition=0;
					vars.table.head.find('th').eq(i+1).append($('<p class="customview-p">').text(vars.fromdate.calc(i+' day').format('Y-m-d')))
					vars.table.head.find('th').eq(i+1).append($('<button class="customview-button time-button">').text('タイムテーブルを表示').on('click',function(){
						var query='';
						query+='view='+vars.config.datetimetable;
						query+='&'+vars.config['fromtime']+'='+$(this).closest('th').find('p').text();
						window.location.href='https://'+$(location).attr('host')+'/k/'+kintone.app.getId()+'/?'+query;
					}));
					/* place the segment data */
					for (var i2=0;i2<legends.length;i2++)
					{
						var filter=$.grep(records,function(item,index){
							var exists=0;
							var date=new Date(item[vars.config['fromtime']].value.dateformat());
							if (date.format('Y-m-d')==vars.fromdate.calc(i+' day').format('Y-m-d')) exists++;
							if (item[legendcode].value==legends[i2]) exists++;
							return exists==2;
						});
						/* rebuild view */
						functions.build(filter,i+1,i2);
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
			query+=vars.config['fromtime']+'>"'+vars.fromdate.calc('-1 day').format('Y-m-d')+'T23:59:59+0900"';
			query+=' and '+vars.config['fromtime']+'<"'+vars.todate.calc('1 day').format('Y-m-d')+'T00:00:00+0900"';
			sort=' order by ';
			for (var i=0;i<vars.segments.length;i++) sort+=vars.segments[i]+' asc,';
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
	 mouse events
	---------------------------------------------------------------*/
	$(window).on('mousemove',function(e){
		/* move balloon */
		$('div.timetable-weekly-balloon').css({
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
		var container=$('div#timetable-container');
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
		kintone.app.getHeaderMenuSpaceElement().innerHTML='';
		kintone.app.getHeaderMenuSpaceElement().appendChild(feed[0]);
		/* setup date value */
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
		/* setup segments value */
		vars.segments=vars.config['segment'].split(',');
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
