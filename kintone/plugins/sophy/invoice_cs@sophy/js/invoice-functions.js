(function($){
jQuery.extend({
	loadapps:function(counter,param,splash,callback){
		if (param[counter].app.length!=0)
		{
			kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:param[counter].app},function(resp){
				if (!$.checkfield(counter,param[counter].appname,resp.properties,splash)) return;
				var body={
					app:param[counter].app,
					query:''
				};
				if (param[counter].isstudent) body.query+='status in ("通塾中") ';
				if ($.minilecindex()==counter) body.query+='date>"'+new Date().calc('-1 day').format('Y-m-d')+'" ';
				body.query+='order by $id asc limit '+param[counter].limit.toString()+' offset '+param[counter].offset.toString();
				kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
					Array.prototype.push.apply(param[counter].records,resp.records);
					param[counter].offset+=param[counter].limit;
					if (resp.records.length==param[counter].limit) $.loadapps(counter,param,splash,callback);
					else
					{
						counter++;
						if (counter<param.length) $.loadapps(counter,param,splash,callback);
						else callback();
					}
				},function(error){
					splash.addClass('hide');
					swal('Error!',error.message,'error');
				});
			},
			function(error){
				splash.addClass('hide');
				swal('Error!',error.message,'error');
			});
		}
		else
		{
			counter++;
			if (counter<param.length) $.loadapps(counter,param,splash,callback);
			else callback();
		}
	},
	coursegrade:function(record,grade){
		var res=null;
		var row=null;
		for (var i=0;i<record['gradetable'].value.length;i++)
		{
			row=record['gradetable'].value[i].value;
			if (parseInt(grade)>parseInt('0'+row['gradefromcode'].value)-1 && parseInt(grade)<parseInt('0'+row['gradetocode'].value)+1) res=row;
		}
		return res;
	},
	createtransfer:function(cell,terms){
		var res=[];
		var baserecordid=($('#baserecordid',cell).val())?$('#baserecordid',cell).val():'';
		var transfertimes=parseInt($('#transfertimes',cell).val())+1;
		if (baserecordid.length==0) baserecordid=$('#\\$id',cell).val();
		for (var i=0;i<terms.length;i++)
			res.push({
				studentcode:{value:$('#studentcode',cell).val()},
				studentname:{value:$('#studentname',cell).val()},
				appcode:{value:$('#appcode',cell).val()},
				appname:{value:$('#appname',cell).val()},
				coursecode:{value:$('#coursecode',cell).val()},
				coursename:{value:$('#coursename',cell).val()},
				date:{value:terms[i].date},
				starttime:{value:terms[i].starttime},
				hours:{value:terms[i].hours},
				baserecordid:{value:baserecordid},
				transfered:{value:0},
				transfertimes:{value:transfertimes},
				transferpending:{value:0},
				transferlimit:{value:$('#transferlimit',cell).val()}
			});
		return res;
	},
	createschedule:function(studentrecords,lecturerecords,checkrecords,lecturecode,lecturename,week,day,limit){
		var res=[];
		for (var i=0;i<studentrecords.length;i++)
		{
			var student=studentrecords[i];
			var course=$.grep(lecturerecords,function(item,index){return (item['code'].value==student['coursecode'].value);})[0];
			var coursegrade=$.coursegrade(course,student['gradecode'].value);
			/* check leave of absence */
			if (day<new Date(student['admissiondate'].value.dateformat())) continue;
			/* check admissiondate */
			if (day>new Date(student['loafrom'].value.dateformat()).calc('-1 day') && day<new Date(student['loato'].value.dateformat()).calc('1 day')) continue;
			/* check week schedule */
			for (var i2=0;i2<student['coursetable'].value.length;i2++)
			{
				var row=student['coursetable'].value[i2].value;
				if (week.indexOf(row['courseweek'].value)==day.getDay())
				{
					var reserved=$.grep(checkrecords,function(item,index){
						var exists=0;
						if (item['studentcode'].value==student['$id'].value) exists++;
						if (item['appcode'].value==lecturecode) exists++;
						return exists==2;
					});
					if (reserved.length==0)
						res.push({
							'$id':{value:''},
							studentcode:{value:student['$id'].value},
							studentname:{value:student['name'].value},
							appcode:{value:lecturecode},
							appname:{value:lecturename},
							coursecode:{value:course['code'].value},
							coursename:{value:course['name'].value},
							date:{value:day.format('Y-m-d')},
							starttime:{value:row['coursestarttime'].value},
							hours:{value:coursegrade['hours'].value},
							baserecordid:{value:null},
							transfered:{value:0},
							transfertimes:{value:0},
							transferpending:{value:0},
							transferlimit:{value:day.calc(limit+' month').format('Y-m-d')}
						});
				}
			}
		}
		return res;
	},
	entryattendants:function(values,progress,entries,callback){
		var error=false;
		var counter=0;
		var message='';
		var results={};
		progress.find('.message').text('スケジュール作成中');
		progress.find('.progressbar').find('.progresscell').width(0);
		progress.show();
		for (var i=0;i<values.length;i++)
		{
			if (error) return;
			if ((function(values,entries){
				return $.grep(entries,function(item,index){
					var exists=0;
					var id=(item['$id'].value)?item['$id'].value:'';
					if (id.length!=0) exists++;
					if (item['studentcode'].value==values.studentcode.value) exists++;
					if (item['appcode'].value==values.appcode.value) exists++;
					if (item['coursecode'].value==values.coursecode.value) exists++;
					if (item['date'].value==values.date.value) exists++;
					if (item['starttime'].value==values.starttime.value) exists++;
					if (item['hours'].value==values.hours.value) exists++;
					return exists==7;
				}).length!=0;
			})(values[i],entries))
			{
				counter++;
				if (message.length==0) message='\n(一部登録済みのスケジュールがありました)';
				continue;
			}
			(function(values,total,callback){
				var body={
					app:kintone.app.getId(),
					record:values
				};
				kintone.api(kintone.api.url('/k/v1/record',true),'POST',body,function(resp){
					if (!(values.studentcode.value in results))
					{
						results[values.studentcode.value]={};
						results[values.studentcode.value][values.coursecode.value]={
							id:[],
							bill:'0'
						};
					}
					if (!(values.coursecode.value in results[values.studentcode.value]))
						results[values.studentcode.value][values.coursecode.value]={
							id:[],
							bill:'0'
						};
					results[values.studentcode.value][values.coursecode.value].id.push(resp.id);
					counter++;
					if (counter<total)
					{
						progress.find('.progressbar').find('.progresscell').width(progress.find('.progressbar').innerWidth()*(counter/total));
					}
					else
					{
						progress.hide();
						if (callback!=null) callback(results,message);
					}
				},function(error){
					progress.hide();
					swal('Error!',error.message,'error');
					error=true;
				});
			})(values[i],values.length,callback);
		}
		if (counter==values.length)
		{
			progress.hide();
			if (values.length==0) swal('Error!','スケジュール作成の対象学年に該当する生徒が見つかりませんでした。','error');
			else swal('Error!','スケジュールは作成済みです。','error');
		}
	},
	entryhistory:function(appcode,absence,cell,callback){
		var body={
			app:appcode,
			record:{
				studentcode:{value:$('#studentcode',cell).val()},
				studentname:{value:$('#studentname',cell).val()},
				appcode:{value:$('#appcode',cell).val()},
				appname:{value:$('#appname',cell).val()},
				coursecode:{value:$('#coursecode',cell).val()},
				coursename:{value:$('#coursename',cell).val()},
				date:{value:new Date($('#date',cell).val().dateformat()).format('Y-m-d')},
				starttime:{value:$('#starttime',cell).val()},
				hours:{value:$('#hours',cell).val()},
				absence:{value:absence.toString()},
				reporttable:{value:[]}
			}
		};
		kintone.api(kintone.api.url('/k/v1/record',true),'POST',body,function(resp){
			if (callback!=null) callback(body.record);
		},function(error){
			swal('Error!',error.message,'error');
		});
	},
	entryminilec:function(lecturecode,lecturename,course,cell,terms,progress,entries,callback){
		if ((function(values,entries){
			return $.grep(entries,function(item,index){
				var exists=0;
				if (item['studentcode'].value==$('#studentcode',cell).val()) exists++;
				if (item['appcode'].value==lecturecode) exists++;
				if (item['coursecode'].value==values['$id'].value) exists++;
				if (item['date'].value==values['date'].value) exists++;
				if (item['starttime'].value==values['starttime'].value) exists++;
				if (item['hours'].value==values['hours'].value) exists++;
				return exists==6;
			}).length!=0;
		})(course,entries))
		{
			swal('Error!','スケジュールは作成済みです。','error');
			return;
		}
		var baserecordid=($('#baserecordid',cell).val())?$('#baserecordid',cell).val():'';
		var transfertimes=parseInt($('#transfertimes',cell).val())+1;
		if (baserecordid.length==0) baserecordid=$('#\\$id',cell).val();
		var body={
			app:kintone.app.getId(),
			record:{
				studentcode:{value:$('#studentcode',cell).val()},
				studentname:{value:$('#studentname',cell).val()},
				appcode:{value:lecturecode},
				appname:{value:lecturename},
				coursecode:{value:course['$id'].value},
				coursename:{value:course['name'].value},
				date:{value:new Date(course['date'].value.dateformat()).format('Y-m-d')},
				starttime:{value:course['starttime'].value},
				hours:{value:course['hours'].value},
				baserecordid:{value:baserecordid},
				transfered:{value:0},
				transfertimes:{value:transfertimes},
				transferpending:{value:0},
				transferlimit:{value:$('#transferlimit',cell).val()}
			}
		};
		kintone.api(kintone.api.url('/k/v1/record',true),'POST',body,function(resp){
			$.entrytransfers(cell,terms,progress,entries,callback);
		},function(error){
			swal('Error!',error.message,'error');
		});
	},
	entrypending:function(cell,progress,entries,callback){
		if ($('#\\$id',cell).val().length==0)
		{
			var entryvalues={};
			$('input#transferpending',cell).val(('1'));
			$.each($('input[type=hidden]',cell),function(){
				if ($(this).attr('id')!='$id') entryvalues[$(this).attr('id')]={value:$(this).val()};
			});
			/* entry attendants */
			$.entryattendants([entryvalues],progress,entries,function(resp,message){
				if (callback!=null) callback();
			});
		}
		else
		{
			var body={
				app:kintone.app.getId(),
				id:$('#\\$id',cell).val(),
				record:{transferpending:{value:1}}
			};
			kintone.api(kintone.api.url('/k/v1/record',true),'PUT',body,function(resp){
				if (callback!=null) callback();
			},function(error){
				swal('Error!',error.message,'error');
			});
		}
	},
	entrytransfers:function(cell,terms,progress,entries,callback){
		if ($('#\\$id',cell).val().length==0)
		{
			var entryvalues={};
			$('input#transfered',cell).val(('1'));
			$.each($('input[type=hidden]',cell),function(){
				if ($(this).attr('id')!='$id') entryvalues[$(this).attr('id')]={value:$(this).val()};
			});
			/* entry attendants */
			$.entryattendants([entryvalues],progress,entries,function(resp,message){
				/* update id */
				$('#\\$id',cell).val(resp[$('#studentcode',cell).val()][$('#coursecode',cell).val()].id[0]);
				/* entry attendants */
				$.entryattendants($.createtransfer(cell,terms),progress,entries,function(resp,message){
					swal({
						title:'振替完了',
						text:'振替完了'+message,
						type:'success'
					},function(){
						if (callback!=null) callback();
					});
				});
			});
		}
		else
		{
			/* entry attendants */
			$.entryattendants($.createtransfer(cell,terms),progress,entries,function(resp,message){
				/* update base attendants */
				if (parseInt($('#transfertimes',cell).val())!=0)
				{
					var body={
						app:kintone.app.getId(),
						query:'baserecordid="'+$('#baserecordid',cell).val()+'" and transfertimes="'+$('#transfertimes',cell).val()+'"'
					};
					kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
						var transfertimes=parseInt($('#transfertimes',cell).val())+1;
						body={
							app:kintone.app.getId(),
							records:[]
						};
						$.each(resp.records,function(index){
							var record=resp.records[index];
							/* the record of cell is transfered */
							if (record['$id'].value==$('#\\$id',cell).val())
							{
								body.records.push({
									id:record['$id'].value,
									record:{
										transfered:{value:1},
										transferpending:{value:0}
									}
								});
							}
							else
							{
								body.records.push({
									id:record['$id'].value,
									record:{
										transfertimes:{value:transfertimes}
									}
								});
							}
						});
						kintone.api(kintone.api.url('/k/v1/records',true),'PUT',body,function(resp){
							swal({
								title:'振替完了',
								text:'振替完了'+message,
								type:'success'
							},function(){
								if (callback!=null) callback();
							});
						},function(error){
							swal('Error!',error.message,'error');
						});
					},
					function(error){
						swal('Error!',error.message,'error');
					});
				}
				else
				{
					var body={
						app:kintone.app.getId(),
						id:$('#\\$id',cell).val(),
						record:{
							transfered:{value:1},
							transferpending:{value:0}
						}
					};
					kintone.api(kintone.api.url('/k/v1/record',true),'PUT',body,function(resp){
						swal({
							title:'振替完了',
							text:'振替完了'+message,
							type:'success'
						},function(){
							if (callback!=null) callback();
						});
					},function(error){
						swal('Error!',error.message,'error');
					});
				}
			});
		}
	},
	minilecindex:function(){
		return 7;
	},
	lecturenames:function(){
		return [
			'通常講座',
			'短期講座',
			'テスト対策講座',
			'英検対策講座',
			'春季特別講座',
			'夏季特別講座',
			'冬季特別講座',
			'ミニレク',
			'朝練',
			'夜練',
			'学校独自検査対策講座'
		];
	},
	checkfield:function(index,name,properties,splash){
		var error='';
		var fieldinfos=$.fieldparallelize(properties);
		switch (index.toString())
		{
			case '0':
				/* 通常講座 */
				if (!('code' in fieldinfos)) error='コースコード';
				if (!('name' in fieldinfos)) error='コース名';
				if (!('gradefromcode' in fieldinfos)) error='学年コード（From）';
				if (!('gradefromname' in fieldinfos)) error='学年名（From）';
				if (!('gradetocode' in fieldinfos)) error='学年コード（To）';
				if (!('gradetoname' in fieldinfos)) error='学年名（To）';
				if (!('hours' in fieldinfos)) error='受講時間(回)';
				if (!('times' in fieldinfos)) error='受講回数(週)';
				if (!('fee' in fieldinfos)) error='受講料';
				if (!('gradetable' in properties)) error='学年テーブル';
				break;
			case '1':
				/* 短期講座 */
				if (!('code' in fieldinfos)) error='コースコード';
				if (!('name' in fieldinfos)) error='コース名';
				if (!('textbookfee' in fieldinfos)) error='教材費';
				if (!('hours' in fieldinfos)) error='受講時間(回)';
				if (!('times' in fieldinfos)) error='受講回数(全)';
				if (!('gradefromcode' in fieldinfos)) error='学年コード（From）';
				if (!('gradefromname' in fieldinfos)) error='学年名（From）';
				if (!('gradetocode' in fieldinfos)) error='学年コード（To）';
				if (!('gradetoname' in fieldinfos)) error='学年名（To）';
				if (!('fee' in fieldinfos)) error='受講料';
				if (!('overfee' in fieldinfos)) error='追加料金';
				if (!('gradetable' in properties)) error='学年テーブル';
				break;
			case '2':
				/* テスト対策講座 */
				if (!('code' in fieldinfos)) error='コースコード';
				if (!('name' in fieldinfos)) error='コース名';
				if (!('textbookfee' in fieldinfos)) error='教材費';
				if (!('hours' in fieldinfos)) error='受講時間(回)';
				if (!('times' in fieldinfos)) error='受講回数(全)';
				if (!('gradefromcode' in fieldinfos)) error='学年コード（From）';
				if (!('gradefromname' in fieldinfos)) error='学年名（From）';
				if (!('gradetocode' in fieldinfos)) error='学年コード（To）';
				if (!('gradetoname' in fieldinfos)) error='学年名（To）';
				if (!('fee' in fieldinfos)) error='受講料';
				if (!('overfee' in fieldinfos)) error='追加料金';
				if (!('gradetable' in properties)) error='学年テーブル';
				break;
			case '3':
				/* 英検対策講座 */
				if (!('code' in fieldinfos)) error='コースコード';
				if (!('name' in fieldinfos)) error='コース名';
				if (!('textbookfee' in fieldinfos)) error='教材費';
				if (!('hours' in fieldinfos)) error='受講時間(回)';
				if (!('times' in fieldinfos)) error='受講回数(全)';
				if (!('gradefromcode' in fieldinfos)) error='学年コード（From）';
				if (!('gradefromname' in fieldinfos)) error='学年名（From）';
				if (!('gradetocode' in fieldinfos)) error='学年コード（To）';
				if (!('gradetoname' in fieldinfos)) error='学年名（To）';
				if (!('fee' in fieldinfos)) error='受講料';
				if (!('overfee' in fieldinfos)) error='追加料金';
				if (!('gradetable' in properties)) error='学年テーブル';
				break;
			case '4':
				/* 春季特別講座 */
				if (!('code' in fieldinfos)) error='コースコード';
				if (!('name' in fieldinfos)) error='コース名';
				if (!('textbookfee' in fieldinfos)) error='教材費';
				if (!('gradefromcode' in fieldinfos)) error='学年コード（From）';
				if (!('gradefromname' in fieldinfos)) error='学年名（From）';
				if (!('gradetocode' in fieldinfos)) error='学年コード（To）';
				if (!('gradetoname' in fieldinfos)) error='学年名（To）';
				if (!('dates' in fieldinfos)) error='受講日';
				if (!('starttime' in fieldinfos)) error='受講開始時刻';
				if (!('hours' in fieldinfos)) error='受講時間(回)';
				if (!('times' in fieldinfos)) error='受講回数(全)';
				if (!('fee' in fieldinfos)) error='受講料';
				if (!('gradetable' in properties)) error='学年テーブル';
				break;
			case '5':
				/* 夏季特別講座 */
				if (!('code' in fieldinfos)) error='コースコード';
				if (!('name' in fieldinfos)) error='コース名';
				if (!('textbookfee' in fieldinfos)) error='教材費';
				if (!('gradefromcode' in fieldinfos)) error='学年コード（From）';
				if (!('gradefromname' in fieldinfos)) error='学年名（From）';
				if (!('gradetocode' in fieldinfos)) error='学年コード（To）';
				if (!('gradetoname' in fieldinfos)) error='学年名（To）';
				if (!('dates' in fieldinfos)) error='受講日';
				if (!('starttime' in fieldinfos)) error='受講開始時刻';
				if (!('hours' in fieldinfos)) error='受講時間(回)';
				if (!('times' in fieldinfos)) error='受講回数(全)';
				if (!('fee' in fieldinfos)) error='受講料';
				if (!('gradetable' in properties)) error='学年テーブル';
				break;
			case '6':
				/* 冬季特別講座 */
				if (!('code' in fieldinfos)) error='コースコード';
				if (!('name' in fieldinfos)) error='コース名';
				if (!('textbookfee' in fieldinfos)) error='教材費';
				if (!('gradefromcode' in fieldinfos)) error='学年コード（From）';
				if (!('gradefromname' in fieldinfos)) error='学年名（From）';
				if (!('gradetocode' in fieldinfos)) error='学年コード（To）';
				if (!('gradetoname' in fieldinfos)) error='学年名（To）';
				if (!('dates' in fieldinfos)) error='受講日';
				if (!('starttime' in fieldinfos)) error='受講開始時刻';
				if (!('hours' in fieldinfos)) error='受講時間(回)';
				if (!('times' in fieldinfos)) error='受講回数(全)';
				if (!('fee' in fieldinfos)) error='受講料';
				if (!('gradetable' in properties)) error='学年テーブル';
				break;
			case '7':
				/* ミニレク */
				if (!('name' in fieldinfos)) error='講座名';
				if (!('lecturetype' in fieldinfos)) error='料金区分';
				if (!('gradefromcode' in fieldinfos)) error='学年コード（From）';
				if (!('gradefromname' in fieldinfos)) error='学年名（From）';
				if (!('gradetocode' in fieldinfos)) error='学年コード（To）';
				if (!('gradetoname' in fieldinfos)) error='学年名（To）';
				if (!('date' in fieldinfos)) error='受講日';
				if (!('starttime' in fieldinfos)) error='受講開始時刻';
				if (!('hours' in fieldinfos)) error='受講時間';
				break;
			case '8':
				/* 朝練 */
				if (!('gradecode' in fieldinfos)) error='学年コード';
				if (!('gradename' in fieldinfos)) error='学年名';
				if (!('bulkfee' in fieldinfos)) error='一括申込料金';
				if (!('name' in fieldinfos)) error='講座名';
				if (!('dates' in fieldinfos)) error='受講日';
				if (!('starttime' in fieldinfos)) error='受講開始時刻';
				if (!('hours' in fieldinfos)) error='受講時間(回)';
				if (!('times' in fieldinfos)) error='受講回数(全)';
				if (!('fee' in fieldinfos)) error='受講料';
				if (!('coursetable' in properties)) error='講座テーブル';
				break;
			case '9':
				/* 夜練 */
				if (!('gradecode' in fieldinfos)) error='学年コード';
				if (!('gradename' in fieldinfos)) error='学年名';
				if (!('dates' in fieldinfos)) error='受講日';
				if (!('starttime' in fieldinfos)) error='受講開始時刻';
				if (!('hours' in fieldinfos)) error='受講時間(回)';
				if (!('times' in fieldinfos)) error='受講回数(全)';
				if (!('fee' in fieldinfos)) error='受講料';
				if (!('splittimes' in fieldinfos)) error='分割回数';
				if (!('bulkfee' in fieldinfos)) error='一括申込料金';
				break;
			case '10':
				/* 学校独自検査対策講座 */
				if (!('gradecode' in fieldinfos)) error='学年コード';
				if (!('gradename' in fieldinfos)) error='学年名';
				if (!('fee' in fieldinfos)) error='受講料';
				if (!('plushours' in fieldinfos)) error='受講時間(回)';
				if (!('plustimes' in fieldinfos)) error='受講回数(全)';
				if (!('interviewhours' in fieldinfos)) error='受講時間(回)';
				if (!('interviewtimes' in fieldinfos)) error='受講回数(全)';
				if (!('subjectcode' in fieldinfos)) error='科目コード';
				if (!('subjectname' in fieldinfos)) error='科目名';
				if (!('dates' in fieldinfos)) error='受講日';
				if (!('starttime' in fieldinfos)) error='受講開始時刻';
				if (!('hours' in fieldinfos)) error='受講時間(回)';
				if (!('times' in fieldinfos)) error='受講回数(全)';
				if (!('subjecttable' in properties)) error='科目テーブル';
				break;
			case '11':
				/* 学年 */
				if (!('code' in fieldinfos)) error='学年コード';
				if (!('name' in fieldinfos)) error='学年名';
				if (!('color' in fieldinfos)) error='区分色';
				break;
			case '12':
				/* 生徒情報 */
				if (!('name' in fieldinfos)) error='氏名';
				if (!('phonetic' in fieldinfos)) error='氏名かな';
				if (!('mail' in fieldinfos)) error='メールアドレス';
				if (!('pwd' in fieldinfos)) error='パスワード';
				if (!('birthday' in fieldinfos)) error='生年月日';
				if (!('sex' in fieldinfos)) error='性別';
				if (!('parentcode' in fieldinfos)) error='保護者番号';
				if (!('parentname' in fieldinfos)) error='保護者名';
				if (!('gradecode' in fieldinfos)) error='学年コード';
				if (!('gradename' in fieldinfos)) error='学年名';
				if (!('admissiondate' in fieldinfos)) error='入塾日';
				if (!('loafrom' in fieldinfos)) error='休塾入り';
				if (!('loato' in fieldinfos)) error='休塾明け';
				if (!('status' in fieldinfos)) error='ステータス';
				if (!('coursecode' in fieldinfos)) error='通常講座コースコード';
				if (!('coursename' in fieldinfos)) error='通常講座コース名';
				if (!('courseweek' in fieldinfos)) error='通常講座来塾曜日';
				if (!('coursestarttime' in fieldinfos)) error='通常講座来塾時間';
				if (!('shortterm1code' in fieldinfos)) error='短期講座コースコード';
				if (!('shortterm1id' in fieldinfos)) error='短期講座ID';
				if (!('shortterm1bill' in fieldinfos)) error='短期講座請求済';
				if (!('shortterm2code' in fieldinfos)) error='テスト対策講座コースコード';
				if (!('shortterm2id' in fieldinfos)) error='テスト対策講座ID';
				if (!('shortterm2bill' in fieldinfos)) error='テスト対策講座請求済';
				if (!('shortterm3code' in fieldinfos)) error='英検対策講座コースコード';
				if (!('shortterm3id' in fieldinfos)) error='英検対策講座ID';
				if (!('shortterm3bill' in fieldinfos)) error='英検対策講座請求済';
				if (!('season1code' in fieldinfos)) error='春季特別講座コースコード';
				if (!('season1id' in fieldinfos)) error='春季特別講座ID';
				if (!('season1bill' in fieldinfos)) error='春季特別講座請求済';
				if (!('season2code' in fieldinfos)) error='夏季特別講座コースコード';
				if (!('season2id' in fieldinfos)) error='夏季特別講座ID';
				if (!('season2bill' in fieldinfos)) error='夏季特別講座請求済';
				if (!('season3code' in fieldinfos)) error='冬季特別講座コースコード';
				if (!('season3id' in fieldinfos)) error='冬季特別講座ID';
				if (!('season3bill' in fieldinfos)) error='冬季特別講座請求済';
				if (!('morningbulkbill' in fieldinfos)) error='朝練一括支払';
				if (!('morningcode' in fieldinfos)) error='朝練コード';
				if (!('morningid' in fieldinfos)) error='朝練ID';
				if (!('morningbill' in fieldinfos)) error='朝練請求済';
				if (!('nightbulkbill' in fieldinfos)) error='夜練一括支払';
				if (!('nightid' in fieldinfos)) error='夜練ID';
				if (!('nightbillmonth' in fieldinfos)) error='夜練請求月';
				if (!('nightbill' in fieldinfos)) error='夜練請求済';
				if (!('individualid' in fieldinfos)) error='学校独自検査対策講座ID';
				if (!('individualplusid' in fieldinfos)) error='学校独自検査対策講座追加授業ID';
				if (!('individualinterviewid' in fieldinfos)) error='学校独自検査対策講座面接ID';
				if (!('individualbill' in fieldinfos)) error='学校独自検査対策講座請求済';
				if (!('coursetable' in properties)) error='通常講座テーブル';
				if (!('shortterm1table' in properties)) error='短期講座テーブル';
				if (!('shortterm2table' in properties)) error='テスト対策講座テーブル';
				if (!('shortterm3table' in properties)) error='英検対策講座テーブル';
				if (!('morningtable' in properties)) error='朝練テーブル';
				if (!('nighttable' in properties)) error='夜練テーブル';
				break;
			case '13':
				/* 基本情報 */
				if (!('starthour' in fieldinfos)) error='始業時間';
				if (!('endhour' in fieldinfos)) error='終業時間';
				if (!('transferlimit' in fieldinfos)) error='振替期限';
				if (!('textbookbillmonths' in fieldinfos)) error='通常講座教材費請求月';
				if (!('taxshift' in fieldinfos)) error='税転嫁';
				if (!('taxround' in fieldinfos)) error='税端数';
				break;
			case '14':
				/* 受講履歴 */
				if (!('studentcode' in fieldinfos)) error='生徒番号';
				if (!('studentname' in fieldinfos)) error='生徒名';
				if (!('appcode' in fieldinfos)) error='講座アプリコード';
				if (!('appname' in fieldinfos)) error='講座アプリ名';
				if (!('coursecode' in fieldinfos)) error='講座コースコード';
				if (!('coursename' in fieldinfos)) error='講座コース名';
				if (!('date' in fieldinfos)) error='受講日';
				if (!('starttime' in fieldinfos)) error='受講開始時刻';
				if (!('hours' in fieldinfos)) error='受講時間';
				if (!('absence' in fieldinfos)) error='欠席';
				if (!('reporttable' in properties)) error='レポート記入テーブル';
				break;
		}
		if (error.length!=0)
		{
			splash.addClass('hide');
			swal('Error!',name+'アプリ内に'+error+'フィールドが見つかりません。','error');
			return false;
		}
		else return true;
	},
	checkreservefield:function(properties){
		var error='';
		var fieldinfos=$.fieldparallelize(properties);
		if (!('studentcode' in fieldinfos)) error='生徒番号';
		if (!('studentname' in fieldinfos)) error='生徒名';
		if (!('appcode' in fieldinfos)) error='講座アプリコード';
		if (!('appname' in fieldinfos)) error='講座アプリ名';
		if (!('coursecode' in fieldinfos)) error='講座コースコード';
		if (!('coursename' in fieldinfos)) error='講座コース名';
		if (!('date' in fieldinfos)) error='受講予定日';
		if (!('starttime' in fieldinfos)) error='受講開始時刻';
		if (!('hours' in fieldinfos)) error='受講時間';
		if (!('baserecordid' in fieldinfos)) error='振替元レコード番号';
		if (!('transfered' in fieldinfos)) error='振替済';
		if (!('transfertimes' in fieldinfos)) error='振替回数';
		if (!('transferpending' in fieldinfos)) error='振替保留';
		if (!('transferlimit' in fieldinfos)) error='振替期限日';
		if (error.length!=0)
		{
			swal('Error!','受講予定アプリ内に'+error+'フィールドが見つかりません。','error');
			return false;
		}
		else return true;
	},
	transfersvg:function(){
		return '<svg version="1.1" id="transfer" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="30px" height="30px" viewBox="0 0 30 30" enable-background="new 0 0 30 30" xml:space="preserve"><circle fill="#FFFFFF" cx="15" cy="15" r="11.5"/><path fill="#8F9491" d="M15,21.923c-2.391,0-4.496-1.212-5.741-3.054H7.473c1.405,2.727,4.249,4.592,7.527,4.592c4.414,0,8.038-3.38,8.427-7.692H25l-2.308-3.077l-2.309,3.077h1.497C21.498,19.23,18.563,21.923,15,21.923z"/><path fill="#8F9491" d="M15,6.539c-4.147,0-7.599,2.983-8.322,6.922H5l2.308,3.076l2.308-3.076H8.249C8.947,10.377,11.706,8.076,15,8.076c2.082,0,3.949,0.919,5.218,2.374l0.298-0.075h1.571C20.575,8.064,17.967,6.539,15,6.539z"/><polygon fill="#8F9491" points="14.283,10.628 14.283,16.387 18.383,18.803 18.783,18.126 15.069,15.918 15.069,10.628 		"/></svg>';
	},
	pendingsvg:function(){
		return '<svg version="1.1" id="pending" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="30px" height="30px" viewBox="0 0 30 30" enable-background="new 0 0 30 30" xml:space="preserve"><circle fill="#FFFFFF" cx="15" cy="15" r="11.5"/><path fill="#8F9491" d="M15,6c-4.943,0-9,4.057-9,9s4.057,9,9,9s9-4.057,9-9S19.943,6,15,6z M9.414,18.972c-0.831-1.165-1.27-2.539-1.27-3.972c0-3.78,3.075-6.855,6.855-6.855c1.432,0,2.806,0.438,3.971,1.27c0.024,0.018,0.046,0.037,0.066,0.058l-9.566,9.566C9.451,19.018,9.432,18.995,9.414,18.972z M15,21.855c-1.432,0-2.806-0.438-3.971-1.27c-0.024-0.018-0.046-0.037-0.066-0.057l9.566-9.566c0.02,0.021,0.039,0.042,0.057,0.066c0.831,1.165,1.27,2.539,1.27,3.971C21.855,18.78,18.78,21.855,15,21.855z"/></svg>';
	},
	minilecsvg:function(){
		return '<svg version="1.1" id="minilec" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="30px" height="30px" viewBox="0 0 30 30" enable-background="new 0 0 30 30" xml:space="preserve"><circle fill="#FFFFFF" cx="15" cy="15" r="11.5"/><path fill="#8F9491" d="M20.105,14.056c0-0.209-0.006-0.405-0.02-0.586c-0.013-0.183-0.038-0.341-0.07-0.476c-0.074-0.296-0.219-0.535-0.436-0.717c-0.215-0.182-0.518-0.276-0.909-0.283c-0.208,0-0.424,0.03-0.646,0.091c-0.222,0.061-0.442,0.146-0.661,.258c-0.22,0.111-0.429,0.245-0.627,0.404c-0.198,0.158-0.379,0.334-0.541,0.53v6.738h-2.393v-5.959c0-0.209-0.007-0.405-0.021-0.586c-0.013-0.183-0.036-0.341-0.069-0.476c-0.075-0.296-0.218-0.535-0.43-0.717c-0.212-0.182-0.518-0.276-0.914-0.283c-0.29,0-0.425,0.03-0.647,0.091c-0.221,0.061-0.442,0.146-0.66,0.258c-0.22,0.111-0.429,0.245-0.627,0.404c-0.199,0.158-0.379,0.334-0.54,0.53v6.738H7.5v-9.788h1.98l0.222,1.363h0.04c0.142-0.202,0.32-0.401,0.535-0.596c0.217-0.195,0.46-0.367,0.732-0.516c0.273-0.148,0.572-0.267,0.899-0.358c0.327-0.09,0.672-0.136,1.035-0.136c0.646,0,1.228,0.143,1.742,0.429c0.516,0.287,0.907,0.732,1.177,1.338h0.04c0.189-0.262,0.399-0.501,0.632-0.717c0.231-0.215,0.49-0.4,0.772-0.556c0.283-0.155,0.587-0.276,0.914-0.363c0.327-0.088,0.676-0.131,1.047-0.131c0.699,0.006,1.287,0.153,1.761,0.439c0.477,0.286,0.841,0.678,1.098,1.176c0.067,0.128,0.124,0.269,0.171,0.42c0.048,0.151,0.086,0.322,0.116,0.51c0.03,0.188,0.052,0.397,0.065,0.626c0.014,0.229,0.021,0.491,0.021,0.788v6.071h-2.395V14.056z"/></svg>';
	},
	greensvg:function(){
		return '<svg version="1.1" id="button" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="30px" height="30px" viewBox="0 0 30 30" enable-background="new 0 0 30 30" xml:space="preserve"><circle fill="#FFFFFF" cx="15" cy="15" r="11.5"/><circle fill="#66bb6a" cx="15" cy="15" r="9"/></svg>';
	},
	redsvg:function(){
		return '<svg version="1.1" id="button" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="30px" height="30px" viewBox="0 0 30 30" enable-background="new 0 0 30 30" xml:space="preserve"><circle fill="#FFFFFF" cx="15" cy="15" r="11.5"/><circle fill="#ef5350" cx="15" cy="15" r="9"/></svg>';
	},
});
})(jQuery);
