/*
*--------------------------------------------------------------------
* jQuery-Plugin "timetable-cancel"
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
		courseselect:null,
		students:null,
		termselect:null,
		termselectsingle:null,
		apps:{},
		lectures:{},
		config:{},
		offset:{},
		const:[],
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
		/* cancel schedule */
		cancelschedule:function(){
			var index=0;
			var ids=[];
			var updatevalues=[];
			var deleteschedule=function(values,callback){
				var error=false;
				var counter=0;
				vars.progress.find('.message').text('キャンセル中');
				vars.progress.find('.progressbar').find('.progresscell').width(0);
				vars.progress.show();
				for (var i=0;i<values.length;i++)
				{
					if (error) return;
					var body={
						app:kintone.app.getId(),
						ids:[values[i]]
					};
					kintone.api(kintone.api.url('/k/v1/records',true),'DELETE',body,function(resp){
						counter++;
						if (counter<values.length)
						{
							vars.progress.find('.progressbar').find('.progresscell').width(vars.progress.find('.progressbar').innerWidth()*(counter/values.length));
						}
						else
						{
							vars.progress.hide();
							callback();
						}
					},function(error){
						vars.progress.hide();
						swal('Error!',error.message,'error');
						error=true;
					});
				}
			}
			if ($('#lecturelist').val().length==0)
			{
				setTimeout(function(){
					swal('Error!','講座を選択して下さい。','error');
				},500);
				return;
			}
			else index=parseInt($('#lecturelist').val());
			if (vars.attendants.find('.list').find('p:visible').length==0)
			{
				setTimeout(function(){
					swal('Error!','キャンセル対象者を選択して下さい。','error');
				},500);
				return;
			}
			vars.progress.find('.message').text('キャンセル準備中');
			vars.progress.find('.progressbar').find('.progresscell').width(0);
			vars.progress.show();
			$.each(vars.attendants.find('.list').find('p:visible'),function(){
				var fieldcode='';
				var studentcode=$(this).attr('id');
				var filter=$.grep(vars.apps[vars.config['student']],function(item,index){
					return (item['$id'].value==studentcode);
				});
				var updatevalue={
					app:vars.config['student'],
					id:studentcode,
					record:{}
				};
				switch (index)
				{
					case 4:
					case 5:
					case 6:
						switch (index)
						{
							case 4:
								fieldcode='season1';
								break;
							case 5:
								fieldcode='season2';
								break;
							case 6:
								fieldcode='season3';
								break;
						}
						if (filter[0][fieldcode+'id'].value) Array.prototype.push.apply(ids,filter[0][fieldcode+'id'].value.split(','));
						updatevalue.record[fieldcode+'code']={value:''};
						updatevalue.record[fieldcode+'id']={value:''};
						updatevalue.record[fieldcode+'bill']={value:'0'};
						updatevalues.push(updatevalue);
						break;
					case 8:
						fieldcode='morning';
						for (var i=0;i<filter[0][fieldcode+'table'].value.length;i++)
							if (filter[0][fieldcode+'table'].value[i].value[fieldcode+'id'].value)
								Array.prototype.push.apply(ids,filter[0][fieldcode+'table'].value[i].value[fieldcode+'id'].value.split(','));
						updatevalue.record[fieldcode+'bulkbill']={value:'0'};
						updatevalue.record[fieldcode+'table']={value:[]};
						updatevalues.push(updatevalue);
						break;
					case 9:
						fieldcode='night';
						if (filter[0][fieldcode+'id'].value) Array.prototype.push.apply(ids,filter[0][fieldcode+'id'].value.split(','));
						updatevalue.record[fieldcode+'id']={value:''};
						updatevalue.record[fieldcode+'bulkbill']={value:'0'};
						updatevalue.record[fieldcode+'table']={value:[]};
						updatevalues.push(updatevalue);
						break;
					case 10:
						fieldcode='individual';
						if (filter[0][fieldcode+'id'].value) Array.prototype.push.apply(ids,filter[0][fieldcode+'id'].value.split(','));
						if (filter[0][fieldcode+'plusid'].value) Array.prototype.push.apply(ids,filter[0][fieldcode+'plusid'].value.split(','));
						if (filter[0][fieldcode+'interviewid'].value) Array.prototype.push.apply(ids,filter[0][fieldcode+'interviewid'].value.split(','));
						updatevalue.record[fieldcode+'id']={value:''};
						updatevalue.record[fieldcode+'plusid']={value:''};
						updatevalue.record[fieldcode+'interviewid']={value:''};
						updatevalue.record[fieldcode+'bill']={value:'0'};
						updatevalues.push(updatevalue);
						break;
				}
			});
			if (ids.length!=0)
			{
				deleteschedule(ids,function(){
					functions.updatestudents(updatevalues);
				});
			}
			else
			{
				vars.progress.hide();
				setTimeout(function(){
					swal('Error!','キャンセル可能な予定がありませんでした。','error');
				},500);
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
		},
		/* update students */
		updatestudents:function(values){
			var error=false;
			var counter=0;
			vars.progress.find('.message').text('生徒情報更新中');
			vars.progress.find('.progressbar').find('.progresscell').width(0);
			vars.progress.show();
			for (var i=0;i<values.length;i++)
			{
				if (error) return;
				kintone.api(kintone.api.url('/k/v1/record',true),'PUT',values[i],function(resp){
					counter++;
					if (counter<values.length)
					{
						vars.progress.find('.progressbar').find('.progresscell').width(vars.progress.find('.progressbar').innerWidth()*(counter/values.length));
					}
					else
					{
						vars.progress.hide();
						swal({
							title:'キャンセル完了',
							text:'キャンセル完了',
							type:'success'
						});
					}
				},function(error){
					vars.progress.hide();
					swal('Error!',error.message,'error');
					error=true;
				});
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
		if (event.viewId!=vars.config.cancel) return;
		/* initialize valiable */
		var container=$('div#timetable-container');
		var parts={
			button:$('<button class="kintoneplugin-button-dialog-ok timetable">'),
			input:$('<div class="kintoneplugin-input-outer timetable">'),
			item:$('<p class="timetable-cancel-item">'),
			select:$('<div class="kintoneplugin-select-outer timetable">')
		};
		var splash=$('<div id="splash">');
		vars.attendants=$('<div class="timetable-cancel-container">');
		vars.progress=$('<div id="progress">').append($('<div class="message">')).append($('<div class="progressbar">').append($('<div class="progresscell">')));
		vars.students=$('<div class="timetable-cancel-container">');
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
			/* get fields of app */
			kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
				vars.fields=['$id'];
				$.each(resp.properties,function(key,values){
					vars.fields.push(values.code);
				});
				if (!$.checkreservefield(resp.properties)) return;
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
					.text('キャンセル対象者一覧にコピー')
					.on('click',function(){
						$.each(vars.students.find('.list').find('p:visible'),function(){
							$('#'+$(this).attr('id'),vars.attendants.find('.list')).show();
						});
					})
				);
				/* setup lectures */
				var lecturecontainer=parts.select.clone(true);
				var lecturelist=lecturecontainer.find('select').attr('id','lecturelist');
				lecturelist.empty().append($('<option>').attr('value','').html('&nbsp;講座選択&nbsp;'));
				for (var i=4;i<vars.lecturekeys.length;i++)
					if (i!=$.minilecindex()) lecturelist.append($('<option>').attr('value',i.toString()).html('&nbsp;'+vars.lectures[vars.lecturekeys[i]].name+'&nbsp;'));
				vars.attendants.append(lecturecontainer);
				vars.attendants.append(
					parts.button.clone(true)
					.text('受講キャンセル')
					.on('click',function(){
						swal({
							title:'確認',
							text:'選択した講座・生徒の予定をキャンセルします。\n宜しいですか?',
							type:'warning',
							showCancelButton:true,
							confirmButtonText:'OK',
							cancelButtonText:"キャンセル"
						},
						function(){
							functions.cancelschedule();
						});
					})
				);
				/* setup students */
				vars.attendants.append($('<p class="timetable-cancel-title">').text('キャンセル対象者一覧'));
				vars.attendants.append($('<div class="timetable-cancel-list list">'));
				vars.students.append($('<p class="timetable-cancel-title">').text('検索結果一覧'));
				vars.students.append($('<div class="timetable-cancel-list list">'));
				for (var i=0;i<vars.apps[vars.config['student']].length;i++)
				{
					var student=vars.apps[vars.config['student']][i];
					var item=parts.item.clone(true).attr('id',student['$id'].value.toString());
					$('#name',item).text(student['name'].value);
					$('#grade',item).val(student['gradecode'].value);
					vars.attendants.find('.list').append(item.clone(true).hide());
					vars.students.find('.list').append(item.clone(true));
				}
			},
			function(error){
				splash.addClass('hide');
				swal('Error!',error.message,'error');
			});
		});
		return;
	});
})(jQuery,kintone.$PLUGIN_ID);
