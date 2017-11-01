/*
*--------------------------------------------------------------------
* jQuery-Plugin "timetable-scheduling"
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
		attendants:null,
		calendar:null,
		progress:null,
		students:null,
		term:null,
		apps:{},
		lectures:{},
		config:{},
		offset:{},
		lecturekeys:[],
		fields:[]
	};
	var events={
		lists:[
			'app.record.index.show'
		]
	};
	var limit=500;
	var functions={
		/* reload datas */
		loaddatas:function(appkey,callback){
			var query='';
			var body={
				app:appkey,
				query:'',
				fields:vars.fields
			};
			query+='date>"'+new Date().calc('-1 day').format('Y-m-d')+'"';
			query+=' limit '+limit.toString()+' offset '+vars.offset[appkey].toString();
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
		},
		/* create schedule */
		createschedule:function(){
			var error=false;
			var index=0;
			var course=null;
			var grade=null;
			var dates=[];
			var values=[];
			if ($('#lecturelist').val().length==0)
			{
				swal('Error!','講座を選択して下さい。','error');
				return;
			}
			else index=parseInt($('#lecturelist').val());
			if ($('#courselist').is(':visible') && $('#courselist').val().length==0)
			{
				swal('Error!',((index==vars.lecturekeys.length-4)?'講座':'コース')+'を選択して下さい。','error');
				return;
			}
			if (vars.attendants.find('.list').find('p:visible').length==0)
			{
				swal('Error!','受講予定者を選択して下さい。','error');
				return;
			}
			switch (index)
			{
				case 1:
				case 2:
				case 3:
					/* get course */
					for (var i=0;i<vars.apps[vars.lecturekeys[index]].length;i++)
					{
						if (vars.apps[vars.lecturekeys[index]][i]['code'].value==$('#courselist').val())
						{
							course=vars.apps[vars.lecturekeys[index]][i];
							break;
						}
					}
					if (course==null)
					{
						swal('Error!','コース指定を確認して下さい。','error');
						return;
					}
					/* get date and time */
					vars.calendar.show({
						activedates:[],
						buttons:{
							ok:function(selection){
								/* close calendar */
								vars.calendar.hide();
								if (selection.length!=course['times'].value)
								{
									swal('Error!','受講回数は'+course['times'].value.toString()+'回です。','error');
									return;
								}
								vars.term.show({
									dates:selection,
									buttons:{
										ok:function(selection){
											/* close term */
											vars.term.hide();
											/* create values */
											$.each(vars.attendants.find('.list').find('p:visible'),function(){
												/* filtering by grade */
												if ($.coursegrade(course,$('#grade',$(this)).val())==null) return true;
												for (var i=0;i<selection.length;i++)
													values.push({
														studentcode:{value:$(this).attr('id')},
														studentname:{value:$('#name',$(this)).text()},
														appcode:{value:vars.lecturekeys[index]},
														appname:{value:vars.lectures[vars.lecturekeys[index]].name},
														coursecode:{value:course['code'].value},
														coursename:{value:course['name'].value},
														date:{value:selection[i].date},
														starttime:{value:selection[i].starttime},
														hours:{value:course['hours'].value},
														baserecordid:{value:null},
														transfered:{value:0},
														transferpending:{value:0},
														transferlimit:{value:null}
													});
											});
											/* regist attendants */
											functions.registattendants(values);
										},
										cancel:function(){
											/* close term */
											vars.term.hide();
										}
									}
								});
							},
							cancel:function(){
								/* close calendar */
								vars.calendar.hide();
							}
						}
					});
					break;
				case 4:
				case 5:
				case 6:
					/* get course */
					for (var i=0;i<vars.apps[vars.lecturekeys[index]].length;i++)
					{
						if (vars.apps[vars.lecturekeys[index]][i]['code'].value==$('#courselist').val())
						{
							course=vars.apps[vars.lecturekeys[index]][i];
							break;
						}
					}
					if (course==null)
					{
						swal('Error!','コース指定を確認して下さい。','error');
						return;
					}
					/* create values */
					$.each(vars.attendants.find('.list').find('p:visible'),function(){
						/* filtering by grade */
						grade=$.coursegrade(course,$('#grade',$(this)).val());
						if (grade==null) return true;
						dates=grade['dates'].value.split(',');
						if (dates.length!=grade['times'].value)
						{
							swal('Error!','受講回数と受講日の日数が合っていません。','error');
							error=true;
							return false;
						}
						for (var i=0;i<dates.length;i++)
							values.push({
								studentcode:{value:$(this).attr('id')},
								studentname:{value:$('#name',$(this)).text()},
								appcode:{value:vars.lecturekeys[index]},
								appname:{value:vars.lectures[vars.lecturekeys[index]].name},
								coursecode:{value:course['code'].value},
								coursename:{value:course['name'].value},
								date:{value:dates[i]},
								starttime:{value:grade['starttime'].value},
								hours:{value:grade['hours'].value},
								baserecordid:{value:null},
								transfered:{value:0},
								transferpending:{value:0},
								transferlimit:{value:null}
							});
					});
					/* regist attendants */
					if (!error) functions.registattendants(values);
					break;
			}
		},
		/* regist attendants */
		registattendants:function(values){
			var error=false;
			var counter=0;
			vars.progress.find('.message').text('スケジュール作成中');
			vars.progress.find('.progressbar').find('.progresscell').width(0);
			vars.progress.show();
			for (var i=0;i<values.length;i++)
			{
				if (error) return;
				var body={
					app:kintone.app.getId(),
					record:values[i]
				};
				kintone.api(kintone.api.url('/k/v1/record',true),'POST',body,function(resp){
					counter++;
					if (counter<values.length) vars.progress.find('.progressbar').find('.progresscell').width(vars.progress.find('.progressbar').innerWidth()*(counter/values.length));
					else
					{
						vars.progress.hide();
						swal({
							title:'登録完了',
							text:'スケジュール作成しました。',
							type:'success'
						});
					}
				},function(error){
					vars.progress.hide();
					swal('Error!',error.message,'error');
					error=true;
				});
			}
		},
		/* search students */
		searchstudents:function(){
			for (var i=0;i<vars.apps[vars.config['student']].length;i++)
			{
				var student=vars.apps[vars.config['student']][i];
				var exists=0;
				if ($('#gradelist').val().length==0) exists++;
				else
				{
					if (student['gradecode'].value==$('#gradelist').val()) exists++;
				}
				if ($('#keywords').val().length==0) exists++;
				else
				{
					if (student['name'].value.match(new RegExp($('#keywords').val(),'g'))) exists++;
					if (student['phonetic'].value.match(new RegExp($('#keywords').val(),'g'))) exists++;
					if (student['parentname'].value.match(new RegExp($('#keywords').val(),'g'))) exists++;
				}
				if (exists>1) $('#'+student['$id'].value.toString(),vars.students.find('.list')).show();
				else $('#'+student['$id'].value.toString(),vars.students.find('.list')).hide();
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
		if (event.viewId!=vars.config.scheduling) return;
		/* initialize valiable */
		var container=$('div#timetable-container');
		var parts={
			button:$('<button class="kintoneplugin-button-dialog-ok timetable">'),
			input:$('<div class="kintoneplugin-input-outer timetable">'),
			item:$('<p class="timetable-scheduling-item">'),
			select:$('<div class="kintoneplugin-select-outer timetable">')
		};
		var splash=$('<div id="splash">');
		vars.attendants=$('<div class="timetable-scheduling-container">');
		vars.progress=$('<div id="progress">').append($('<div class="message">')).append($('<div class="progressbar">').append($('<div class="progresscell">')));
		vars.students=$('<div class="timetable-scheduling-container">');
		parts.input.append($('<input type="text" class="kintoneplugin-input-text">'));
		parts.input.append($('<button>'));
		parts.item.append($('<span id="name">'));
		parts.item.append($('<input type="hidden" id="grade">'));
		parts.item.append(
			$('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/close.png" alt="削除" title="削除">')
			.on('click',function(){$(this).closest('p').hide()})
		);
		parts.select.append(
			$('<div class="kintoneplugin-select">')
			.append($('<select>'))
		);
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
		container.empty();
		container.append(vars.students);
		container.append(vars.attendants);
		$('body').append(vars.progress);
		$('body').append(splash);
		/* day pickup */
		vars.calendar=$('body').calendar({
			multi:true,
			span:2
		});
		/* term pickup */
		vars.term=$('body').term({
			fromhour:0,
			tohour:24,
			isterm:false
		});
		/* setup lectures value */
		vars.lectures=JSON.parse(vars.config['lecture']);
		vars.lecturekeys=Object.keys(vars.lectures);
		/* check app fields */
		var counter=0;
		var param=[];
		$.each(vars.lectures,function(key,values){
			param.push({
				app:key,
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
		$.loadapps(counter,param,splash,function(){
			splash.addClass('hide');
			for (var i=0;i<param.length;i++) vars.apps[param[i].app]=param[i].records;
			/* get fields of app */
			kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
				vars.fields=['$id'];
				$.each(resp.properties,function(key,values){
					vars.fields.push(values.code);
				});
				if (!$.checkreservefield(resp.properties)) return;
				/* reload datas */
				vars.apps[kintone.app.getId()]=null;
				vars.offset[kintone.app.getId()]=0;
				functions.loaddatas(kintone.app.getId(),function(){
					/* setup grades */
					var gradecontainer=parts.select.clone(true);
					var gradelist=gradecontainer.find('select').attr('id','gradelist');
					gradelist.empty().append($('<option>').attr('value','').html('&nbsp;学年選択&nbsp;'));
					for (var i=0;i<vars.apps[vars.config['grade']].length;i++)
					{
						var grade=vars.apps[vars.config['grade']][i];
						gradelist.append($('<option>').attr('value',grade['code'].value).html('&nbsp;'+grade['name'].value+'&nbsp;'));
					}
					gradelist.on('change',function(){functions.searchstudents();});
					vars.students.append(gradecontainer);
					/* setup keywords */
					var keywordcontainer=parts.input.clone(true);
					keywordcontainer.find('input').attr('id','keywords').attr('placeholder','氏名・カナ・保護者名で検索');
					keywordcontainer.find('button').on('click',function(){functions.searchstudents();});
					vars.students.append(keywordcontainer);
					vars.students.append(
						parts.button.clone(true)
						.text('受講予定者一覧にコピー')
						.on('click',function(){
							$.each(vars.students.find('.list').find('p:visible'),function(){
								$('#'+$(this).attr('id'),vars.attendants.find('.list')).show();
							});
						})
					);
					/* setup lectures */
					var lecturecontainer=parts.select.clone(true);
					var lecturelist=lecturecontainer.find('select').attr('id','lecturelist');
					var coursecontainer=parts.select.clone(true);
					var courselist=coursecontainer.find('select').attr('id','courselist');
					lecturelist.empty().append($('<option>').attr('value','').html('&nbsp;講座選択&nbsp;'));
					for (var i=1;i<vars.lecturekeys.length;i++) lecturelist.append($('<option>').attr('value',i.toString()).html('&nbsp;'+vars.lectures[vars.lecturekeys[i]].name+'&nbsp;'));
					lecturelist.on('change',function(){
						/* setup courses */
						if ($(this).val().length==0)
						{
							courselist.empty().append($('<option>').attr('value','').text(''));
							coursecontainer.hide();
						}
						else
						{
							var index=parseInt($(this).val());
							if (index<vars.lecturekeys.length-3)
							{
								courselist.empty().append($('<option>').attr('value','').html('&nbsp;'+((index==vars.lecturekeys.length-4)?'講座選択':'コース選択')+'&nbsp;'));
								for (var i=0;i<vars.apps[vars.lecturekeys[index]].length;i++)
								{
									var course=vars.apps[vars.lecturekeys[index]][i];
									if (index==vars.lecturekeys.length-4) courselist.append($('<option>').attr('value',course['$id'].value).html('&nbsp;'+course['name'].value+'&nbsp;'));
									else courselist.append($('<option>').attr('value',course['code'].value).html('&nbsp;'+course['name'].value+'&nbsp;'));
								}
								coursecontainer.show();
								return;
							}
							courselist.empty().append($('<option>').attr('value','').text(''));
							coursecontainer.hide();
						}
					});
					vars.attendants.append(lecturecontainer);
					vars.attendants.append(coursecontainer.hide());
					vars.attendants.append(
						parts.button.clone(true)
						.text('スケジュール作成')
						.on('click',function(){functions.createschedule();})
					);
					/* setup students */
					vars.attendants.append($('<p class="timetable-scheduling-title">').text('受講予定者一覧'));
					vars.attendants.append($('<div class="timetable-scheduling-list list">'));
					vars.students.append($('<p class="timetable-scheduling-title">').text('検索結果一覧'));
					vars.students.append($('<div class="timetable-scheduling-list list">'));
					for (var i=0;i<vars.apps[vars.config['student']].length;i++)
					{
						var student=vars.apps[vars.config['student']][i];
						var item=parts.item.clone(true).attr('id',student['$id'].value.toString());
						$('#name',item).text(student['name'].value);
						$('#grade',item).val(student['gradecode'].value);
						vars.attendants.find('.list').append(item.clone(true).hide());
						vars.students.find('.list').append(item.clone(true));
					}
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
