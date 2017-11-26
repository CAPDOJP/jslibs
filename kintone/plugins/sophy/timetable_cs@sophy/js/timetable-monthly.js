/*
*--------------------------------------------------------------------
* jQuery-Plugin "timetable-monthly"
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
		fromdate:new Date(),
		todate:new Date(),
		graphlegend:null,
		progress:null,
		table:null,
		minilecselect:null,
		termselect:null,
		apps:{},
		lectures:{},
		config:{},
		offset:{},
		const:[],
		lecturekeys:[],
		fields:[],
		tooltips:[],
		week:['日','月','火','水','木','金','土']
	};
	var events={
		lists:[
			'app.record.index.show'
		]
	};
	var limit=500;
	var functions={
		/* rebuild view */
		build:function(filter,cell){
			if (filter.length!=0)
			{
				for (var i=0;i<filter.length;i++)
				{
					var fromtime=new Date((vars.fromdate.format('Y-m-d')+'T'+filter[i]['starttime'].value+':00+09:00').dateformat());
					var totime=new Date(fromtime.getTime()+(parseFloat(filter[i]['hours'].value)*1000*60*60));
					var student=$.grep(vars.apps[vars.config['student']],function(item,index){return (item['$id'].value==filter[i]['studentcode'].value);})[0];
					var grade=$.grep(vars.apps[vars.config['grade']],function(item,index){return (item['code'].value==student['gradecode'].value);})[0];
					var item=$('<div class="timetable-monthly-cell">');
					/* append cell */
					cell.append(
						item
						.append(
							$('<p class="timetable-datacell multi">')
							.append(
								$('<span>').addClass('grade')
								.css({'background-color':'#'+grade['color'].value})
								.text(grade['name'].value)
							)
							.append(
								$('<span>').addClass('lecture')
								.css({
									'background-color':'#'+vars.lectures[filter[i]['appcode'].value].color
								})
								.append(
									$('<span>').addClass('button')
									.append(
										$($.transfersvg())
										.on('click',function(){
											var cell=$(this).closest('.timetable-monthly-cell');
											/* get date and time for transfer */
											vars.termselect.show({
												fromhour:parseInt(vars.const['starthour'].value),
												tohour:parseInt(vars.const['endhour'].value),
												buttons:{
													ok:function(selection){
														/* close termselect */
														vars.termselect.hide();
														var endhour=new Date((new Date().format('Y-m-d')+'T'+('0'+vars.const['endhour'].value).slice(-2)+':00:00+09:00').dateformat());
														var hours=0;
														for (var i=0;i<selection.length;i++)
														{
															if (new Date((new Date().format('Y-m-d')+'T'+selection[i].endtime+':00+09:00').dateformat())>endhour)
															{
																swal('Error!','受講終了時間が終業時刻を超えています。','error');
																/* redisplay termselect */
																vars.termselect.unhide();
																return;
															}
															hours+=selection[i].hours;
														}
														if (hours!=parseFloat($('#hours',cell).val()))
														{
															swal('Error!','振替前と振替後の時間が合いません。','error');
															/* redisplay termselect */
															vars.termselect.unhide();
															return;
														}
														/* entry transfers */
														$.entrytransfers(cell,selection,vars.progress,vars.apps[kintone.app.getId()],function(){
															/* reload view */
															functions.load();
														});
													},
													cancel:function(){
														/* close termselect */
														vars.termselect.hide();
													}
												}
											});
										})
										.on({
											'mouseenter':function(){$(this).closest('.button').addClass('show');},
											'mouseleave':function(){$(this).closest('.button').removeClass('show');}
										})
									)
								)
								.append(
									$('<span>').addClass('button')
									.append(
										$($.pendingsvg())
										.on('click',function(){
											var cell=$(this).closest('.timetable-monthly-cell');
											swal({
												title:'確認',
												text:'振替保留にします。宜しいですか？',
												type:'warning',
												allowOutsideClick:false,
												showCancelButton:true,
												confirmButtonText:'OK',
												cancelButtonText:'Cancel'
											},
											function(){
												/* entry pending */
												$.entrypending(cell,vars.progress,vars.apps[kintone.app.getId()],function(){
													/* reload view */
													functions.load();
												});
											});
										})
										.on({
											'mouseenter':function(){$(this).closest('.button').addClass('show');},
											'mouseleave':function(){$(this).closest('.button').removeClass('show');}
										})
									)
								)
							)
							.append(
								$('<span>').addClass('name')
								.text(filter[i]['studentname'].value)
							)
						)
					);
					if (vars.lecturekeys[$.minilecindex()]!=filter[i]['appcode'].value)
					{
						var lecturecode=vars.lecturekeys[$.minilecindex()];
						var lecturename=vars.lectures[lecturecode].name;
						$('.lecture',item).append(
							$('<span>').addClass('button')
							.append(
								$($.minilecsvg())
								.on('click',function(){
									var cell=$(this).closest('.timetable-monthly-cell');
									vars.minilecselect.datasource=[];
									for (var i2=0;i2<vars.apps[lecturecode].length;i2++)
									{
										var course=vars.apps[lecturecode][i2];
										if (course['lecturetype'].value=='無料') continue;
										vars.minilecselect.datasource.push(course);
									}
									vars.minilecselect.search();
									vars.minilecselect.show({
										buttons:{
											cancel:function(){
												/* close the reference box */
												vars.minilecselect.hide();
											}
										},
										callback:function(row){
											/* close the reference box */
											vars.minilecselect.hide();
											var course=$.grep(vars.apps[lecturecode],function(item,index){
												return item['$id'].value==$('#\\$id',row).val();
											});
											if (course.length==0) return;
											vars.termselect.show({
												fromhour:parseInt(vars.const['starthour'].value),
												tohour:parseInt(vars.const['endhour'].value)-Math.ceil(parseFloat(course[0]['hours'].value)),
												dates:[new Date($('#date',cell).val().dateformat()).format('Y-m-d')],
												buttons:{
													ok:function(selection){
														/* close termselect */
														vars.termselect.hide();
														var endhour=new Date((new Date().format('Y-m-d')+'T'+('0'+vars.const['endhour'].value).slice(-2)+':00:00+09:00').dateformat());
														var hours=0;
														for (var i2=0;i2<selection.length;i2++)
														{
															if (new Date((new Date().format('Y-m-d')+'T'+selection[i2].endtime+':00+09:00').dateformat())>endhour)
															{
																swal('Error!','受講終了時間が終業時刻を超えています。','error');
																/* redisplay termselect */
																vars.termselect.unhide();
																return;
															}
															hours+=selection[i2].hours;
														}
														if (hours+parseFloat(course[0]['hours'].value)!=parseFloat($('#hours',cell).val()))
														{
															swal('Error!','振替前と振替後の時間が合いません。','error');
															/* redisplay termselect */
															vars.termselect.unhide();
															return;
														}
														/* entry transfers */
														$.entryminilec(lecturecode,lecturename,course[0],cell,selection,vars.progress,vars.apps[kintone.app.getId()],function(){
															/* reload view */
															functions.load();
														});
													},
													cancel:function(){
														/* close termselect */
														vars.termselect.hide();
													}
												}
											});
										}
									});
								})
								.on({
									'mouseenter':function(){$(this).closest('.button').addClass('show');},
									'mouseleave':function(){$(this).closest('.button').removeClass('show');}
								})
							)
						);
					}
					$.each(filter[i],function(key,values){
						if (values!=null)
							if (values.value!=null)
								item.append($('<input type="hidden">').attr('id',key).val(values.value));
					});
					/* append balloon */
					var balloon=$('<div class="timetable-balloon">');
					var inner='';
					inner+='<p class="timetable-tooltip">';
					for (var i2=0;i2<vars.tooltips.length;i2++) inner+='<span>'+filter[i][vars.tooltips[i2]].value+'</span>';
					inner+='</p>';
					inner+='<p>'+fromtime.format('H:i')+' ～ '+totime.format('H:i')+'</p>';
					$('body').append(
						balloon.css({
							'z-index':(vars.apps[kintone.app.getId()].length+$('div.timetable-balloon').length+1).toString()
						})
						.html(inner)
					);
					/* setup item datas */
					$.data(item[0],'balloon',balloon);
					/* mouse events */
					item.on({
						'mouseenter':function(){$.data($(this)[0],'balloon').addClass('timetable-balloon-show');},
						'mouseleave':function(){$.data($(this)[0],'balloon').removeClass('timetable-balloon-show');}
					});
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
				/* clear balloon */
				$('div.timetable-balloon').remove();
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
							query+='view='+vars.config.datetimetable+'&date='+day.format('Y-m-d');
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
					var filter=$.grep(records,function(item,index){
						return item['date'].value==day.format('Y-m-d');
					});
					/* append recoed of schedule */
					if (day>new Date().calc('-1 day'))
					{
						var schedule=$.createschedule(
							vars.apps[vars.config['student']],
							vars.apps[vars.lecturekeys[0]],
							filter,
							vars.lecturekeys[0],
							vars.lectures[vars.lecturekeys[0]].name,
							vars.week,
							day,
							vars.const['transferlimit'].value
						);
						Array.prototype.push.apply(filter,schedule);
						Array.prototype.push.apply(records,schedule);
					}
					filter=$.grep(filter,function(item,index){
						var exists=0;
						if (item['transfered'].value==0) exists++;
						if (item['transferpending'].value==0) exists++;
						return exists==2;
					});
					/* sort */
					filter.sort(function(a,b){
						if(a['starttime'].value<b['starttime'].value) return -1;
						if(a['starttime'].value>b['starttime'].value) return 1;
						return 0;
					});
					/* rebuild view */
					functions.build(filter,cell);
				});
				/* check no element rows */
				$.each(vars.table.contents.find('tr'),function(index,values){
					if (!$(this).find('div').size()) $(this).hide();
				})
			});
		},
		/* reload datas */
		loaddatas:function(appkey,callback){
			var query=kintone.app.getQueryCondition();
			var body={
				app:appkey,
				query:'',
				fields:vars.fields
			};
			query+=((query.length!=0)?' and ':'');
			query+='date>"'+vars.fromdate.calc('-1 day').format('Y-m-d')+'" and date<"'+vars.todate.calc('1 day').format('Y-m-d')+'"';
			query+=' order by date asc,starttime asc limit '+limit.toString()+' offset '+vars.offset[appkey].toString();
			body.query+=query;
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				if (vars.apps[appkey]==null) vars.apps[appkey]=resp.records;
				else Array.prototype.push.apply(vars.apps[appkey],resp.records);
				vars.offset[appkey]+=limit;
				if (resp.records.length==limit) functions.loaddatas(appkey,callback);
				else callback();
			},
			function(error){
				swal('Error!',error.message,'error');
			});
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
		if (event.viewId!=vars.config.monthtimetable) return;
		/* initialize valiable */
		var container=$('div#timetable-container').css({'padding-bottom':'100px'});
		var feed=$('<div class="timetable-headermenucontents">');
		var month=$('<span id="month" class="customview-span">');
		var prev=$('<button id="prev" class="customview-button prev-button">');
		var next=$('<button id="next" class="customview-button next-button">');
		var splash=$('<div id="splash">');
		vars.graphlegend=$('<div class="timetable-graphlegend">');
		vars.progress=$('<div id="progress">').append($('<div class="message">')).append($('<div class="progressbar">').append($('<div class="progresscell">')));
		splash.append(
			$('<p>')
			.append($('<span>').text('now loading'))
			.append($('<span class="dot progress1">').text('.'))
			.append($('<span class="dot progress2">').text('.'))
			.append($('<span class="dot progress3">').text('.'))
			.append($('<span class="dot progress4">').text('.'))
			.append($('<span class="dot progress5">').text('.'))
		);
		/* append elements */
		feed.append(prev);
		feed.append(month);
		feed.append(next);
		kintone.app.getHeaderMenuSpaceElement().innerHTML='';
		kintone.app.getHeaderMenuSpaceElement().appendChild(feed[0]);
		$('body').append(vars.progress);
		$('body').append(splash);
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
		/* setup lectures value */
		vars.lectures=JSON.parse(vars.config['lecture']);
		vars.lecturekeys=Object.keys(vars.lectures);
		/* setup tooltips value */
		vars.tooltips=vars.config['tooltip'].split(',');
		/* check app fields */
		var counter=0;
		var param=[];
		$.each(vars.lectures,function(key,values){
			param.push({
				app:(key==vars.lecturekeys[0] || key==vars.lecturekeys[$.minilecindex()])?key:'',
				appname:values.name,
				limit:limit,
				offset:0,
				records:[],
				isstudent:false
			});
		});
		param.push({
			app:vars.config['grade'],
			appname:'学年',
			limit:limit,
			offset:0,
			records:[],
			isstudent:false
		});
		param.push({
			app:vars.config['student'],
			appname:'生徒情報',
			limit:limit,
			offset:0,
			records:[],
			isstudent:true
		});
		param.push({
			app:vars.config['const'],
			appname:'基本情報',
			limit:limit,
			offset:0,
			records:[],
			isstudent:false
		});
		$.loadapps(counter,param,splash,function(){
			splash.addClass('hide');
			for (var i=0;i<param.length;i++) vars.apps[param[i].app]=param[i].records;
			if (vars.apps[vars.config['const']].length==0) {swal('Error!','基本情報が登録されていません。','error');return;}
			else vars.const=vars.apps[vars.config['const']][0];
			/* create minilecselect */
			vars.minilecselect=$('body').referer({
				datasource:null,
				displaytext:['name'],
				buttons:[
					{
						id:'cancel',
						text:'Cancel'
					}
				]
			});
			/* create termselect */
			vars.termselect=$('body').termselect({
				isadd:true,
				isdatepick:true,
				buttons:{
					ok:{
						text:'OK'
					},
					cancel:{
						text:'Cancel'
					}
				}
			});
			/* append graph legend */
			$.each(vars.lectures,function(key,values){
				vars.graphlegend
				.append($('<span class="customview-span timetable-graphlegend-color">').css({'background-color':'#'+values.color}))
				.append($('<span class="customview-span timetable-graphlegend-title">').text(values.name));
			});
			container.empty().append(vars.graphlegend);
			/* create table */
			var head=$('<tr>');
			var template=$('<tr>');
			for (var i=0;i<7;i++)
			{
				head.append($('<th>').text(vars.week[i]));
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
				$.each(resp.properties,function(key,values){
					vars.fields.push(values.code);
				});
				if (!$.checkreservefield(resp.properties)) return;
				/* reload view */
				functions.load();
			},
			function(error){
				splash.addClass('hide');
				swal('Error!',error.message,'error');
			});
		});
		return;
	});
})(jQuery,kintone.$PLUGIN_ID);
