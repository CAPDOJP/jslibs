(function($){
jQuery.extend({
	loadapps:function(counter,param,splash,callback){
		if (param[counter].app.length!=0)
		{
			kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:param[counter].app},function(resp){
				if (!$.checkfield(counter,param[counter].appname,resp.properties,splash)) return;
				var body={
					app:param[counter].app,
					query:((param[counter].isstudent)?'status in ("通塾中") ':'')+'order by $id asc limit '+param[counter].limit.toString()+' offset '+param[counter].offset.toString()
				};
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
	createschedule:function(studentrecords,lecturerecords,checkrecords,lecturecode,lecturename,week,day){
		var res=[];
		for (var i=0;i<studentrecords.length;i++)
		{
			var student=studentrecords[i];
			var course=$.grep(lecturerecords,function(item,index){return (item['code'].value==student['coursecode'].value);})[0];
			var coursegrade=$.coursegrade(course,student['gradecode'].value);
			/* check admissiondate */
			if (day<new Date(student['admissiondate'].value.dateformat())) continue;
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
							transferpending:{value:0},
							transferlimit:{value:null}
						});
				}
			}
		}
		return res;
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
				if (!('admissiondate' in fieldinfos)) error='入学日';
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
		if (!('transferpending' in fieldinfos)) error='振替保留';
		if (!('transferlimit' in fieldinfos)) error='振替期限日';
		if (error.length!=0)
		{
			swal('Error!','受講予定アプリ内に'+error+'フィールドが見つかりません。','error');
			return false;
		}
		else return true;
	}
});
var TermDialog=function(options){
	var options=$.extend({
		container:null,
		fromhour:0,
		tohour:24,
		isterm:true
	},options);
	/* property */
	this.params=options;
	/* valiable */
	var my=this;
	/* create elements */
	var div=$('<div>').css({
		'box-sizing':'border-box',
		'margin':'0px',
		'padding':'0px',
		'position':'relative',
		'vertical-align':'top'
	});
	var button=$('<button>').css({
		'background-color':'transparent',
		'background-position':'left top',
		'background-repeat':'no-repeat',
		'background-size':'30px 30px',
		'border':'none',
		'box-sizing':'border-box',
		'cursor':'pointer',
		'font-size':'13px',
		'height':'30px',
		'line-height':'30px',
		'margin':'0px',
	    'outline':'none',
	    'padding':'0px',
		'width':'30px'
	});
	var select=$('<select>').css({
		'border':'1px solid #C9C9C9',
		'border-radius':'3px',
		'box-sizing':'border-box',
		'display':'inline-block',
		'height':'30px',
		'margin':'0px',
		'padding':'0px 0.5em',
		'width':'auto'
	});
	var span=$('<span>').css({
		'box-sizing':'border-box',
		'display':'inline-block',
		'line-height':'30px',
		'margin':'0px',
		'padding':'0px 5px',
		'vertical-align':'top'
	});
	/* append elements */
	this.cover=div.clone(true).css({
		'background-color':'rgba(0,0,0,0.5)',
		'display':'none',
		'height':'100%',
		'left':'0px',
		'position':'fixed',
		'top':'0px',
		'width':'100%',
		'z-index':'999999'
	});
	this.container=div.clone(true).css({
		'background-color':'#FFFFFF',
		'bottom':'0',
		'border-radius':'5px',
		'box-shadow':'0px 0px 3px rgba(0,0,0,0.35)',
		'height':'500px',
		'left':'0',
		'margin':'auto',
		'max-height':'100%',
		'max-width':'100%',
		'padding':'45px 5px',
		'position':'absolute',
		'right':'0',
		'text-align':'center',
		'top':'0',
		'width':((options.isterm)?450:300).toString()+'px'
	})
	.append(
		$('<p>').css({
			'box-sizing':'border-box',
			'position':'absolute',
			'left':'0px',
			'line-height':'45px',
			'margin':'0px',
			'padding':'0px',
			'text-align':'center',
			'top':'0px',
			'width':'100%',
			'z-index':'1'
		})
		.text('時間設定')
	)
	.append(
		div.clone(true).addClass('terms').css({
			'margin':'0px',
			'height':'100%',
			'padding':'5px',
			'overflow-x':'hidden',
			'overflow-y':'auto',
			'width':'100%',
			'z-index':'2'
		})
	);
	this.buttonblock=div.clone(true).css({
		'bottom':'0px',
		'height':'45px',
		'left':'0px',
		'line-height':'45px',
		'padding':'0px',
		'position':'absolute',
		'text-align':'center',
		'width':'100%',
		'z-index':'3'
	})
	.append(
		button.clone(true).css({
			'border':'1px solid #C9C9C9',
			'border-radius':'3px',
			'margin':'0px 5px',
			'width':'6em'
		})
		.attr('id','ok')
		.text('OK')
	)
	.append(
		button.clone(true).css({
			'border':'1px solid #C9C9C9',
			'border-radius':'3px',
			'margin':'0px 5px',
			'width':'6em'
		})
		.attr('id','cancel')
		.text('Cancel')
	);
	this.hour=select.clone(true);
	for (var i=options.fromhour;i<options.tohour+1;i++) this.hour.append($('<option>').attr('value',('0'+i.toString()).slice(-2)).text(('0'+i.toString()).slice(-2)));
	this.minute=select.clone(true)
	.append($('<option>').attr('value','00').text('00'))
	.append($('<option>').attr('value','30').text('30'));
	this.template=div.clone(true).addClass('term').css({
		'border-bottom':'1px dotted #C9C9C9',
		'padding':'3px',
		'width':'100%'
	});
	this.template.append(
		span.clone(true).addClass('date').css({
			'width':'calc(100% - '+((options.isterm)?300:150).toString()+'px)'
		})
	);
	this.template.append(this.hour.clone(true).addClass('starthour').val('00'));
	this.template.append(span.clone(true).text('：'));
	this.template.append(this.minute.clone(true).addClass('startminute').val('00'));
	if (options.isterm)
	{
		this.template.append(span.clone(true).text('&nbsp;~&nbsp;'));
		this.template.append(this.hour.clone(true).addClass('endhour').val('00'));
		this.template.append(span.clone(true).text('：'));
		this.template.append(this.minute.clone(true).addClass('endminute').val('00'));
	}
	/* append elements */
	this.container.append(this.buttonblock);
	this.cover.append(this.container);
	options.container.append(this.cover);
};
TermDialog.prototype={
	/* display calendar */
	show:function(options){
		var options=$.extend({
			dates:[],
			buttons:{}
		},options);
		var my=this;
		$.each(options.buttons,function(key,values){
			if (my.buttonblock.find('button#'+key).size())
				my.buttonblock.find('button#'+key).off('click').on('click',function(){
					if (values!=null)
					{
						var datetimes=[];
						$.each($('div.term',my.container),function(){
							var row=$(this);
							datetimes.push({
								date:$('.date',row).text(),
								starttime:$('.starthour',row).val()+':'+$('.startminute',row).val(),
								endtime:(($('.endhour',row).size())?$('.endhour',row).val():'00')+':'+(($('.endminute',row).size())?$('.endminute',row).val():'00')
							});
						});
						values(datetimes);
					}
				});
		});
		$('div.terms',this.container).empty();
		for (var i=0;i<options.dates.length;i++)
		{
			var row=this.template.clone(true);
			$('.date',row).text(options.dates[i]);
			$('div.terms',this.container).append(row);
		}
		this.cover.show();
	},
	/* hide calendar */
	hide:function(){
		this.cover.hide();
	}
};
jQuery.fn.term=function(options){
	var options=$.extend({
		container:null,
		fromhour:0,
		tohour:24,
		isterm:true
	},options);
	options.container=this;
	return new TermDialog(options);
};
})(jQuery);
