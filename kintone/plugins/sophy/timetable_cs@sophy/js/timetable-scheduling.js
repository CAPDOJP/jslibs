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
		/* convert table records for update */
		converttablerecords:function(rows,values){
			var res=[];
			var row={};
			for (var i=0;i<values.length;i++)
			{
				row={value:{}};
				$.each(values[i],function(key,values){
					row.value[key]={value:values};
				});
				rows.push(row);
			}
			for (var i=0;i<rows.length;i++)
			{
				row={value:{}};
				$.each(rows[i].value,function(key,values){
					row.value[key]={value:values.value};
				});
				res.push(row);
			}
			return res;
		},
		/* create schedule */
		createschedule:function(){
			var error=false;
			var index=0;
			var course=null;
			var grade=null;
			var row=null;
			var dates=[];
			var checktime=new Date();
			var entryvalues=[];
			var updatevalues=[];
			if ($('#lecturelist').val().length==0)
			{
				swal('Error!','講座を選択して下さい。','error');
				return;
			}
			else index=parseInt($('#lecturelist').val());
			if ($('#courselist').is(':visible') && $('#courselist').val().length==0)
			{
				swal('Error!',(($.minilecindex()==index)?'講座':'コース')+'を選択して下さい。','error');
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
									swal({
										title:'Error!',
										text:'受講回数は'+course['times'].value.toString()+'回です。',
										type:'error'
									},function(){
										vars.calendar.unhide();
									});
									return;
								}
								vars.termselect.show({
									fromhour:parseInt(vars.const['starthour'].value),
									tohour:parseInt(vars.const['endhour'].value)-Math.ceil(parseFloat(course['hours'].value)),
									dates:selection,
									buttons:{
										ok:function(selection){
											/* close termselect */
											vars.termselect.hide();
											var endhour=new Date((new Date().format('Y-m-d')+'T'+('0'+vars.const['endhour'].value).slice(-2)+':00:00+09:00').dateformat());
											var overhours=0;
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
												if (parseFloat(selection[i].hours)<parseFloat(course['hours'].value))
												{
													swal({
														title:'Error!',
														text:'受講時間がコース指定時間を下回っています。',
														type:'error'
													},function(){
														vars.termselect.unhide();
													});
													return;
												}
												else overhours+=parseFloat(selection[i].hours)-parseFloat(course['hours'].value);
											}
											/* create values */
											$.each(vars.attendants.find('.list').find('p:visible'),function(){
												/* filtering by grade */
												if ($.coursegrade(course,$('#grade',$(this)).val())==null) return true;
												for (var i=0;i<selection.length;i++)
													entryvalues.push({
														studentcode:{value:$(this).attr('id')},
														studentname:{value:$('#name',$(this)).text()},
														appcode:{value:vars.lecturekeys[index]},
														appname:{value:vars.lectures[vars.lecturekeys[index]].name},
														coursecode:{value:course['code'].value},
														coursename:{value:course['name'].value},
														date:{value:selection[i].date},
														starttime:{value:selection[i].starttime},
														hours:{value:selection[i].hours},
														baserecordid:{value:null},
														transfered:{value:0},
														transfertimes:{value:0},
														transferpending:{value:0},
														transferlimit:{value:new Date(selection[i].date).calc(vars.const['transferlimit'].value+' month').format('Y-m-d')}
													});
											});
											/* entry attendants */
											$.entryattendants(entryvalues,vars.progress,vars.apps[kintone.app.getId()],function(resp,message){
												/* update students */
												$.each(resp,function(key,values){
													var filter=$.grep(vars.apps[vars.config['student']],function(item,index){
														return (item['$id'].value==key);
													});
													var updatevalue={
														app:vars.config['student'],
														id:key,
														record:{}
													};
													var courses=Object.keys(values);
													var fieldcode='';
													if (filter.length==0) return true;
													switch (index)
													{
														case 1:
															fieldcode='shortterm1';
															break;
														case 2:
															fieldcode='shortterm2';
															break;
														case 3:
															fieldcode='shortterm3';
															break;
													}
													row={};
													row[fieldcode+'code']=courses[0];
													row[fieldcode+'id']=values[courses[0]].id.join(',');
													row[fieldcode+'over']=overhours;
													row[fieldcode+'bill']=values[courses[0]].bill;
													updatevalue.record[fieldcode+'table']={value:functions.converttablerecords(filter[0][fieldcode+'table'].value,[row])};
													updatevalues.push(updatevalue);
												});
												functions.updatestudents(updatevalues,message);
											});
										},
										cancel:function(){
											/* close termselect */
											vars.termselect.hide();
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
							entryvalues.push({
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
								transfertimes:{value:0},
								transferpending:{value:0},
								transferlimit:{value:new Date(dates[i]).calc(vars.const['transferlimit'].value+' month').format('Y-m-d')}
							});
					});
					/* entry attendants */
					if (error) return;
					$.entryattendants(entryvalues,vars.progress,vars.apps[kintone.app.getId()],function(resp,message){
						/* update students */
						$.each(resp,function(key,values){
							var filter=$.grep(vars.apps[vars.config['student']],function(item,index){
								return (item['$id'].value==key);
							});
							var updatevalue={
								app:vars.config['student'],
								id:key,
								record:{}
							};
							var courses=Object.keys(values);
							var fieldcode='';
							if (filter.length==0) return true;
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
							updatevalue.record[fieldcode+'code']={value:courses[0]};
							updatevalue.record[fieldcode+'id']={value:values[courses[0]].id.join(',')};
							updatevalue.record[fieldcode+'bill']={value:values[courses[0]].bill};
							updatevalues.push(updatevalue);
						});
						functions.updatestudents(updatevalues,message);
					});
					break;
				case 7:
					/* get course */
					for (var i=0;i<vars.apps[vars.lecturekeys[index]].length;i++)
					{
						if (vars.apps[vars.lecturekeys[index]][i]['$id'].value==$('#courselist').val())
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
						if (parseInt($('#grade',$(this)).val())<parseInt('0'+course['gradefromcode'].value) || parseInt($('#grade',$(this)).val())>parseInt('0'+course['gradetocode'].value)) return true;
						entryvalues.push({
							studentcode:{value:$(this).attr('id')},
							studentname:{value:$('#name',$(this)).text()},
							appcode:{value:vars.lecturekeys[index]},
							appname:{value:vars.lectures[vars.lecturekeys[index]].name},
							coursecode:{value:course['$id'].value},
							coursename:{value:course['name'].value},
							date:{value:new Date(course['date'].value.dateformat()).format('Y-m-d')},
							starttime:{value:course['starttime'].value},
							hours:{value:course['hours'].value},
							baserecordid:{value:null},
							transfered:{value:0},
							transfertimes:{value:0},
							transferpending:{value:0},
							transferlimit:{value:new Date(course['date'].value.dateformat()).calc(vars.const['transferlimit'].value+' month').format('Y-m-d')}
						});
					});
					/* entry attendants */
					if (error) return;
					$.entryattendants(entryvalues,vars.progress,vars.apps[kintone.app.getId()],function(resp,message){
						swal({
							title:'登録完了',
							text:'スケジュール作成完了'+message,
							type:'success'
						});
					});
					break;
				case 8:
					/* get course */
					if (vars.apps[vars.lecturekeys[index]].length==0)
					{
						swal('Error!','朝練を登録して下さい。','error');
						return;
					}
					else course=vars.apps[vars.lecturekeys[index]][vars.apps[vars.lecturekeys[index]].length-1];
					var datasource=[];
					var selected=[];
					for (var i=0;i<course['coursetable'].value.length;i++)
					{
						row=course['coursetable'].value[i];
						datasource.push({
							text:row.value['name'].value,
							value:row.id
						});
						selected.push(row.id);
					}
					vars.courseselect.show({
						datasource:datasource,
						buttons:{
							ok:function(selection){
								/* close the courseselect */
								vars.courseselect.hide();
								if (Object.keys(selection).length==0) return;
								/* create values */
								$.each(vars.attendants.find('.list').find('p:visible'),function(){
									/* filtering by grade */
									if (course['gradecode'].value!=$('#grade',$(this)).val()) return true;
									for (var i=0;i<course['coursetable'].value.length;i++)
									{
										row=course['coursetable'].value[i];
										if (!(row.id in selection)) continue;
										dates=row.value['dates'].value.split(',');
										if (dates.length!=row.value['times'].value)
										{
											swal('Error!','受講回数と受講日の日数が合っていません。','error');
											error=true;
											return false;
										}
										for (var i2=0;i2<dates.length;i2++)
											entryvalues.push({
												studentcode:{value:$(this).attr('id')},
												studentname:{value:$('#name',$(this)).text()},
												appcode:{value:vars.lecturekeys[index]},
												appname:{value:vars.lectures[vars.lecturekeys[index]].name},
												coursecode:{value:row.id},
												coursename:{value:row.value['name'].value},
												date:{value:dates[i2]},
												starttime:{value:row.value['starttime'].value},
												hours:{value:row.value['hours'].value},
												baserecordid:{value:null},
												transfered:{value:0},
												transfertimes:{value:0},
												transferpending:{value:0},
												transferlimit:{value:new Date(dates[i2]).calc(vars.const['transferlimit'].value+' month').format('Y-m-d')}
											});
									}
								});
								/* entry attendants */
								if (error) return;
								$.entryattendants(entryvalues,vars.progress,vars.apps[kintone.app.getId()],function(resp,message){
									/* update students */
									$.each(resp,function(key,values){
										var filter=$.grep(vars.apps[vars.config['student']],function(item,index){
											return (item['$id'].value==key);
										});
										var updatevalue={
											app:vars.config['student'],
											id:key,
											record:{}
										};
										var courses=Object.keys(values);
										var fieldcode='morning';
										var rows=[];
										if (filter.length==0) return true;
										for (var i=0;i<courses.length;i++)
										{
											row={};
											row[fieldcode+'code']=courses[i];
											row[fieldcode+'id']=values[courses[i]].id.join(',');
											row[fieldcode+'bill']=values[courses[i]].bill;
											rows.push(row);
										}
										updatevalue.record[fieldcode+'table']={value:functions.converttablerecords(filter[0][fieldcode+'table'].value,rows)};
										updatevalue.record[fieldcode+'bulkbill']={value:(Object.keys(selection).length==datasource.length)?1:0};
										updatevalues.push(updatevalue);
									});
									functions.updatestudents(updatevalues,message);
								});
							},
							cancel:function(){
								/* close the courseselect */
								vars.courseselect.hide();
							}
						},
						selected:selected
					});
					break;
				case 9:
					/* get course */
					if (vars.apps[vars.lecturekeys[index]].length==0)
					{
						swal('Error!','夜練を登録して下さい。','error');
						return;
					}
					else course=vars.apps[vars.lecturekeys[index]][vars.apps[vars.lecturekeys[index]].length-1];
					/* create values */
					$.each(vars.attendants.find('.list').find('p:visible'),function(){
						/* filtering by grade */
						if (course['gradecode'].value!=$('#grade',$(this)).val()) return true;
						dates=course['dates'].value.split(',');
						if (dates.length!=course['times'].value)
						{
							swal('Error!','受講回数と受講日の日数が合っていません。','error');
							error=true;
							return false;
						}
						for (var i=0;i<dates.length;i++)
							entryvalues.push({
								studentcode:{value:$(this).attr('id')},
								studentname:{value:$('#name',$(this)).text()},
								appcode:{value:vars.lecturekeys[index]},
								appname:{value:vars.lectures[vars.lecturekeys[index]].name},
								coursecode:{value:''},
								coursename:{value:''},
								date:{value:dates[i]},
								starttime:{value:course['starttime'].value},
								hours:{value:course['hours'].value},
								baserecordid:{value:null},
								transfered:{value:0},
								transfertimes:{value:0},
								transferpending:{value:0},
								transferlimit:{value:new Date(dates[i]).calc(vars.const['transferlimit'].value+' month').format('Y-m-d')}
							});
					});
					/* entry attendants */
					if (error) return;
					$.entryattendants(entryvalues,vars.progress,vars.apps[kintone.app.getId()],function(resp,message){
						/* update students */
						$.each(resp,function(key,values){
							var filter=$.grep(vars.apps[vars.config['student']],function(item,index){
								return (item['$id'].value==key);
							});
							var updatevalue={
								app:vars.config['student'],
								id:key,
								record:{}
							};
							var courses=Object.keys(values);
							var fieldcode='night';
							if (filter.length==0) return true;
							updatevalue.record[fieldcode+'id']={value:values[courses[0]].id.join(',')};
							updatevalues.push(updatevalue);
						});
						functions.updatestudents(updatevalues,message);
					});
					break;
				case 10:
					/* get course */
					if (vars.apps[vars.lecturekeys[index]].length==0)
					{
						swal('Error!','学校独自検査対策講座を登録して下さい。','error');
						return;
					}
					else course=vars.apps[vars.lecturekeys[index]][vars.apps[vars.lecturekeys[index]].length-1];
					/* create values */
					$.each(vars.attendants.find('.list').find('p:visible'),function(){
						/* filtering by grade */
						if (course['gradecode'].value!=$('#grade',$(this)).val()) return true;
						for (var i=0;i<course['subjecttable'].value.length;i++)
						{
							row=course['subjecttable'].value[i];
							dates=row.value['dates'].value.split(',');
							if (dates.length!=row.value['times'].value)
							{
								swal('Error!','受講回数と受講日の日数が合っていません。','error');
								error=true;
								return false;
							}
							for (var i2=0;i2<dates.length;i2++)
								entryvalues.push({
									studentcode:{value:$(this).attr('id')},
									studentname:{value:$('#name',$(this)).text()},
									appcode:{value:vars.lecturekeys[index]},
									appname:{value:vars.lectures[vars.lecturekeys[index]].name},
									coursecode:{value:row.value['subjectcode'].value},
									coursename:{value:row.value['subjectname'].value},
									date:{value:dates[i2]},
									starttime:{value:row.value['starttime'].value},
									hours:{value:row.value['hours'].value},
									baserecordid:{value:null},
									transfered:{value:0},
									transfertimes:{value:0},
									transferpending:{value:0},
									transferlimit:{value:new Date(dates[i2]).calc(vars.const['transferlimit'].value+' month').format('Y-m-d')}
								});
						}
					});
					/* entry attendants */
					if (error) return;
					$.entryattendants(entryvalues,vars.progress,vars.apps[kintone.app.getId()],function(resp,message){
						/* update students */
						$.each(resp,function(key,values){
							var filter=$.grep(vars.apps[vars.config['student']],function(item,index){
								return (item['$id'].value==key);
							});
							var updatevalue={
								app:vars.config['student'],
								id:key,
								record:{}
							};
							var courses=Object.keys(values);
							var fieldcode='individual';
							var id=[];
							if (filter.length==0) return true;
							for (var i=0;i<courses.length;i++) Array.prototype.push.apply(id,values[courses[i]].id);
							updatevalue.record[fieldcode+'id']={value:id.join(',')};
							updatevalues.push(updatevalue);
						});
						functions.updatestudents(updatevalues,message);
					});
					break;
				case 11:
				case 12:
					var fieldcode='';
					switch (index)
					{
						case 11:
							fieldcode='plus';
							break;
						case 12:
							fieldcode='interview';
							break;
					}
					index=10;
					/* get course */
					if (vars.apps[vars.lecturekeys[index]].length==0)
					{
						swal('Error!','学校独自検査対策講座を登録して下さい。','error');
						return;
					}
					else course=vars.apps[vars.lecturekeys[index]][vars.apps[vars.lecturekeys[index]].length-1];
					/* get date and time */
					vars.calendar.show({
						activedates:[],
						buttons:{
							ok:function(selection){
								/* close calendar */
								vars.calendar.hide();
								if (selection.length!=course[fieldcode+'times'].value)
								{
									swal({
										title:'Error!',
										text:'受講回数は'+course[fieldcode+'times'].value.toString()+'回です。',
										type:'error'
									},function(){
										vars.calendar.unhide();
									});
									return;
								}
								vars.termselectsingle.show({
									fromhour:parseInt(vars.const['starthour'].value),
									tohour:parseInt(vars.const['endhour'].value)-Math.ceil(parseFloat(course[fieldcode+'hours'].value)),
									dates:selection,
									buttons:{
										ok:function(selection){
											/* close termselectsingle */
											vars.termselectsingle.hide();
											/* create values */
											$.each(vars.attendants.find('.list').find('p:visible'),function(){
												/* filtering by grade */
												if (course['gradecode'].value!=$('#grade',$(this)).val()) return true;
												for (var i=0;i<selection.length;i++)
													entryvalues.push({
														studentcode:{value:$(this).attr('id')},
														studentname:{value:$('#name',$(this)).text()},
														appcode:{value:vars.lecturekeys[index]},
														appname:{value:vars.lectures[vars.lecturekeys[index]].name},
														coursecode:{value:'-1'},
														coursename:{value:$('#lecturelist').find('option:selected').html().replace(/(&nbsp;|学校独自検査対策講座)/g,'')},
														date:{value:selection[i].date},
														starttime:{value:selection[i].starttime},
														hours:{value:course[fieldcode+'hours'].value},
														baserecordid:{value:null},
														transfered:{value:0},
														transfertimes:{value:0},
														transferpending:{value:0},
														transferlimit:{value:new Date(selection[i].date).calc(vars.const['transferlimit'].value+' month').format('Y-m-d')}
													});
											});
											/* entry attendants */
											$.entryattendants(entryvalues,vars.progress,vars.apps[kintone.app.getId()],function(resp,message){
												/* update students */
												$.each(resp,function(key,values){
													var filter=$.grep(vars.apps[vars.config['student']],function(item,index){
														return (item['$id'].value==key);
													});
													var updatevalue={
														app:vars.config['student'],
														id:key,
														record:{}
													};
													var courses=Object.keys(values);
													if (filter.length==0) return true;
													updatevalue.record['individual'+fieldcode+'id']={value:values[courses[0]].id.join(',')};
													updatevalues.push(updatevalue);
												});
												functions.updatestudents(updatevalues,message);
											});
										},
										cancel:function(){
											/* close termselectsingle */
											vars.termselectsingle.hide();
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
		updatestudents:function(values,message){
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
							title:'登録完了',
							text:'スケジュール作成完了'+message,
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
			/* day pickup */
			vars.calendar=$('body').calendar({
				multi:true,
				span:2
			});
			/* create termselect */
			vars.termselect=$('body').termselect({
				buttons:{
					ok:{
						text:'OK'
					},
					cancel:{
						text:'Cancel'
					}
				}
			});
			vars.termselectsingle=$('body').termselect({
				issingle:true,
				buttons:{
					ok:{
						text:'OK'
					},
					cancel:{
						text:'Cancel'
					}
				}
			});
			/* create courseselect */
			vars.courseselect=$('body').multiselect({
				buttons:{
					ok:{
						text:'OK'
					},
					cancel:{
						text:'Cancel'
					}
				}
			});
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
					lecturelist.append($('<option>').attr('value',(vars.lecturekeys.length).toString()).html('&nbsp;学校独自検査対策講座追加授業&nbsp;'));
					lecturelist.append($('<option>').attr('value',(vars.lecturekeys.length+1).toString()).html('&nbsp;学校独自検査対策講座面接&nbsp;'));
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
								if ($.minilecindex()==index)
								{
									courselist.empty().append($('<option>').attr('value','').html('&nbsp;講座選択&nbsp;'));
									for (var i=0;i<vars.apps[vars.lecturekeys[index]].length;i++)
									{
										var course=vars.apps[vars.lecturekeys[index]][i];
										if (course['lecturetype'].value=='有料') continue;
										courselist.append($('<option>').attr('value',course['$id'].value).html('&nbsp;'+course['name'].value+'&nbsp;'));
									}
								}
								else
								{
									courselist.empty().append($('<option>').attr('value','').html('&nbsp;コース選択&nbsp;'));
									for (var i=0;i<vars.apps[vars.lecturekeys[index]].length;i++)
									{
										var course=vars.apps[vars.lecturekeys[index]][i];
										courselist.append($('<option>').attr('value',course['code'].value).html('&nbsp;'+course['name'].value+'&nbsp;'));
									}
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
