/*
*--------------------------------------------------------------------
* jQuery-Plugin "timetable-pending"
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
		progress:null,
		table:null,
		termselect:null,
		studentselect:null,
		apps:{},
		lectures:{},
		config:{},
		offset:{},
		const:[],
		lecturekeys:[],
		fields:[],
	};
	var events={
		lists:[
			'app.record.index.show'
		]
	};
	var limit=500;
	var functions={
		/* rebuild view */
		build:function(filter){
			/* insert row */
			for (var i=0;i<filter.length;i++)
				vars.table.insertrow(null,function(row){
					$.each(row.find('td'),function(){
						var code=$(this).attr('class');
						if (!code) return true;
						if (!(code in filter[i])) return true;
						$(this).text($.fieldvalue(filter[i][code]));
					});
					$.each(filter[i],function(key,values){
						if (values!=null)
							if (values.value!=null)
								row.find('td').last().append($('<input type="hidden">').attr('id',key).val(values.value));
					});
				});
		},
		/* reload view */
		load:function(){
			var records=vars.apps[kintone.app.getId()];
			var filter=$.grep(records,function(item,index){
				var exists=0;
				if ($('.searchstudent').val().length==0) exists++;
				if (item['studentcode'].value==$('.searchstudent').val()) exists++;
				if (item['transferpending'].value==1) exists++;
				return exists==2;
			});
			/* initialize table */
			vars.table.clearrows();
			/* rebuild view */
			if (filter.length!=0) functions.build(filter);
		},
		/* reload datas */
		loaddatas:function(appkey,callback){
			var query=kintone.app.getQueryCondition();
			var body={
				app:appkey,
				query:'transferpending=1 order by studentcode asc limit '+limit.toString()+' offset '+vars.offset[appkey].toString(),
				fields:vars.fields
			};
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				if (vars.apps[appkey]==null) vars.apps[appkey]=resp.records;
				else Array.prototype.push.apply(vars.apps[appkey],resp.records);
				vars.offset[appkey]+=limit;
				if (resp.records.length==limit) functions.loaddatas(appkey,callback);
				else callback();
			},function(error){
				swal('Error!',error.message,'error');
			});
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.lists,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return false;
		/* check viewid */
		if (event.viewId!=vars.config.pending) return;
		/* initialize valiable */
		var container=$('div#timetable-container');
		var splash=$('<div id="splash">');
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
		kintone.app.getHeaderMenuSpaceElement().innerHTML='';
		kintone.app.getHeaderMenuSpaceElement().appendChild($('<button class="kintoneplugin-button-dialog-ok searchstudentbutton">')[0]);
		kintone.app.getHeaderMenuSpaceElement().appendChild(
			$('<div class="timetable-headermenucontents">').css({'display':'none'})
			.append($('<span class="customview-span searchstudentname">').css({'padding':'0px 5px 0px 15px'}))
			.append($('<button class="customview-button close-button clearstudentbutton">'))
			.append($('<input type="hidden" class="searchstudent">'))
			[0]
		);
		$('body').append(vars.progress);
		$('body').append(splash);
		$('.searchstudentbutton')
		.text('生徒選択')
		.on('click',function(e){
			vars.studentselect.show({
				buttons:{
					cancel:function(){
						/* close the reference box */
						vars.studentselect.hide();
					}
				},
				callback:function(row){
					/* close the reference box */
					vars.studentselect.hide();
					$('.searchstudent').val(row.find('#\\$id').val());
					$('.searchstudentname').text(row.find('#name').val());
					$('.searchstudentname').closest('div').show();
					/* reload view */
					functions.load();
				}
			});
		});
		$('.clearstudentbutton')
		.on('click',function(e){
			$('.searchstudent').val('');
			$('.searchstudentname').text('');
			$('.searchstudentname').closest('div').hide();
			/* reload view */
			functions.load();
		});
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
		/* setup lectures value */
		vars.lectures=JSON.parse(vars.config['lecture']);
		vars.lecturekeys=Object.keys(vars.lectures);
		/* check app fields */
		var counter=0;
		var param=[];
		$.each(vars.lectures,function(key,values){
			param.push({
				app:'',
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
			/* create studentselect box */
			vars.studentselect=$('body').referer({
				datasource:vars.apps[vars.config['student']],
				displaytext:['gradename','name'],
				buttons:[
					{
						id:'cancel',
						text:'キャンセル'
					}
				],
				searches:[
					{
						id:'gradecode',
						class:'referer-select',
						label:'学年',
						type:'select',
						param:{app:vars.config['grade']},
						value:'code',
						text:'name',
						callback:function(row){
							vars.studentselect.search();
						}
					}
				]
			});
			vars.studentselect.searchblock.find('select').closest('label').css({'width':'100%'});
			vars.studentselect.searchblock.find('button').hide();
			container.empty();
			/* get fields of app */
			kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
				vars.fields=['$id'];
				$.each(resp.properties,function(key,values){
					vars.fields.push(values.code);
				});
				if (!$.checkreservefield(resp.properties)) return;
				/* create table */
				var head=$('<tr>');
				var template=$('<tr>');
				var columns=[
					'studentname',
					'appname',
					'coursename',
					'date',
					'starttime',
					'hours'
				];
				for (var i=0;i<columns.length;i++)
				{
					head.append($('<th>').text(resp.properties[columns[i]].label));
					template.append($('<td class="'+resp.properties[columns[i]].code+'">'));
				}
				head.append($('<th>'));
				template.append(
					$('<td>')
					.append(
						$('<span>')
						.append(
							$($.transfersvg())
							.on('click',function(){
								var cell=$(this).closest('td');
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
													swal({
														title:'Error!',
														text:'受講終了時間が終業時刻を超えています。',
														type:'error'
													},function(){
														vars.termselect.unhide();
													});
													return;
												}
												hours+=selection[i].hours;
											}
											if (hours!=parseFloat($('#hours',cell).val()))
											{
												swal({
													title:'Error!',
													text:'振替前と振替後の時間が合いません。',
													type:'error'
												},function(){
													vars.termselect.unhide();
												});
												return;
											}
											/* entry transfers */
											$.entrytransfers(cell,selection,vars.progress,vars.apps[kintone.app.getId()],function(){
												var index=-1;
												for (var i=0;i<vars.apps[kintone.app.getId()].length;i++)
													if (vars.apps[kintone.app.getId()][i]['$id'].value==$('#\\$id',cell).val()) {index=i;break;}
												if (index>-1) vars.apps[kintone.app.getId()].splice(index,1);
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
				);
				vars.table=$('<table id="timetable" class="customview-table timetable-pending">').mergetable({
					container:container,
					head:head,
					template:template,
					merge:false,
					mergeclass:'timetable-merge'
				});
				/* reload datas */
				vars.apps[kintone.app.getId()]=null;
				vars.offset[kintone.app.getId()]=0;
				functions.loaddatas(kintone.app.getId(),function(){
					/* reload view */
					functions.load();
				});
			},
			function(error){
				splash.addClass('hide');
				swal('Error!',error.message,'error');
			});
		});
		return;
	});
})(jQuery,kintone.$PLUGIN_ID);
