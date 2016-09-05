/*
*--------------------------------------------------------------------
* jQuery-Plugin "timetable-weekly"
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
		cellposition:0,
		cellwidth:13,
		fromdate:new Date(),
		todate:new Date(),
		calendar:null,
		graphlegend:null,
		segment:null,
		table:null,
		config:{},
		fields:[],
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
				var date=new Date(filter[0][vars.config['date']].value);
				for (var i=0;i<filter.length;i++)
				{
					/* create cell */
					var fromtime=new Date(date.format('Y-m-d')+'T'+filter[i][vars.config['fromtime']].value+':00+09:00');
					var totime=new Date(date.format('Y-m-d')+'T'+filter[i][vars.config['totime']].value+':00+09:00');
					var from=(fromtime.getHours())*2+Math.floor(fromtime.getMinutes()/30);
					var to=(totime.getHours())*2+Math.ceil(totime.getMinutes()/30);
					var row=vars.table.contents.find('tr').eq(from);
					var position=positions.min;
					from=vars.table.contents.find('tr').eq(from).position().top;
					to=vars.table.contents.find('tr').eq(to).position().top;
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
						'background-color':color,
						'height':(to-from)+'px',
						'left':(vars.cellwidth*position)+'px'
					});
					cells.push(cell);
					row.find('td').eq(columnindex).append(cell);
					/* append balloon */
					var balloon=$('<div class="timetable-weekly-balloon">');
					var inner='';
					inner='';
					inner+='<p class="customview-p">'+filter[i][vars.config['display']].value+'</p>';
					inner+='<p class="customview-p">'+filter[i][vars.config['fromtime']].value+' ～ '+filter[i][vars.config['totime']].value+'</p>';
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
			var sort='';
			var body={
				app:kintone.app.getId(),
				query:vars.config['date']+'>"'+vars.fromdate.calc('-1 day').format('Y-m-d')+'" and '+vars.config['date']+'<"'+vars.todate.calc('1 day').format('Y-m-d')+'"',
				fields:vars.fields
			};
			sort=' order by ';
			sort+=vars.config['date']+' asc,';
			sort+=(vars.config['segment'].length!=0)?vars.config['segment']+' asc,':'';
			sort+=vars.config['fromtime']+' asc';
			body.query+=sort;
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				var records=resp.records;
				var color='';
				/* initialize cells */
			    $('div.timetable-weekly-cell').remove();
			    $('div.timetable-weekly-balloon').remove();
				$.each(vars.table.head.find('th'),function(index){$(this).css({'width':'auto'});})
				for (var i=0;i<7;i++)
				{
					vars.cellposition=0;
					vars.table.head.find('th').eq(i+1).text(vars.fromdate.calc(i+' day').format('Y-m-d'));
					if (vars.config['segment'].length!=0)
					{
						/* place the segment data */
						$.each(vars.segment,function(index,values){
							filter=$.grep(records,function(item,index){
								var exists=0;
								if (item[vars.config['date']].value==vars.fromdate.calc(i+' day').format('Y-m-d')) exists++;
								if (item[vars.config['segment']].value==values[vars.config['segmentappfield']].value) exists++;
								return exists==2;
							});
							/* rebuild view */
							functions.build(filter,i+1,index);
						});
					}
					else
					{
						var filter=$.grep(records,function(item,index){return item[vars.config['date']].value==vars.fromdate.calc(i+' day').format('Y-m-d');});
						/* rebuild view */
						functions.build(filter,i+1,0);
					}
				}
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
		var week=$('<span id="week" class="customview-span">');
		var button=$('<button id="datepick" class="customview-button calendar-button">');
		var prev=$('<button id="prev" class="customview-button prev-button">');
		var next=$('<button id="next" class="customview-button next-button">');
		vars.graphlegend=$('<div class="timetable-weekly-graphlegend">');
		/* append elements */
		kintone.app.getHeaderMenuSpaceElement().appendChild(prev[0]);
		kintone.app.getHeaderMenuSpaceElement().appendChild(week[0]);
		kintone.app.getHeaderMenuSpaceElement().appendChild(next[0]);
		/* setup date value */
		vars.fromdate.setDate(vars.fromdate.getDate()+vars.fromdate.getDay()*-1);
		vars.todate=vars.fromdate.calc('6 day');
		week.text(vars.fromdate.format('Y-m-d')+' ～ '+vars.todate.format('Y-m-d'));
		/* day pickup button */
		vars.calendar=$('body').calendar({
			selected:function(target,value){
				vars.fromdate.setDate(new Date(value).getDate()+new Date(value).getDay()*-1);
				vars.todate=vars.fromdate.calc('6 day');
				week.text(vars.fromdate.format('Y-m-d')+' ～ '+vars.todate.format('Y-m-d'));
				/* reload view */
				functions.load();
			}
		});
		button.on('click',function(){
		    vars.calendar.show({active:vars.fromdate});
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
			vars.table.insertrow(null,function(row){
				var hourrow=row;
				vars.table.insertrow(row,function(row){
					var minuterow=row;
					hourrow.find('td').eq(0).attr('rowspan',2).text(i);
			        minuterow.find('td').eq(0).hide();
				});
			});
		}
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
					/* append graph legend */
					$.each(vars.segment,function(index,values){
						var color=vars.colors[index%vars.colors.length];
						vars.graphlegend
						.append($('<span class="customview-span timetable-weekly-graphlegend-color">').css({'background-color':color}))
						.append($('<span class="customview-span timetable-weekly-graphlegend-title">').text(values[vars.config['segmentdisplay']].value));
					});
					/* reload view */
					functions.load();
				},function(error){});
			}
			else functions.load();
		},function(error){});
		return;
	});
})(jQuery,kintone.$PLUGIN_ID);
