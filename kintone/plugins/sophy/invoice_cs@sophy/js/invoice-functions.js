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
	entryinvoices:function(values,progress,callback){
		var error=false;
		var counter=0;
		for (var i=0;i<values.length;i++)
		{
			if (error) return;
			(function(values,total,callback){
				var body={
					app:kintone.app.getId(),
					record:values
				};
				kintone.api(kintone.api.url('/k/v1/record',true),'POST',body,function(resp){
					counter++;
					if (counter<total)
					{
						progress.find('.progressbar').find('.progresscell').width(progress.find('.progressbar').innerWidth()*(counter/total));
					}
					else
					{
						progress.hide();
						if (callback!=null) callback();
					}
				},function(error){
					progress.hide();
					swal('Error!',error.message,'error');
					error=true;
				});
			})(values[i],values.length,callback);
		}
		if (values.length==0)
		{
			progress.hide();
			swal('Error!','請求書作成に該当するデータが見つかりませんでした。','error');
		}
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
			case '8':
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
			case '9':
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
			case '10':
				/* 学年 */
				if (!('code' in fieldinfos)) error='学年コード';
				if (!('name' in fieldinfos)) error='学年名';
				if (!('color' in fieldinfos)) error='区分色';
				break;
			case '11':
				/* 保護者情報 */
				if (!('name' in fieldinfos)) error='氏名';
				if (!('phonetic' in fieldinfos)) error='氏名かな';
				if (!('mail' in fieldinfos)) error='メールアドレス';
				if (!('question' in fieldinfos)) error='秘密の質問';
				if (!('postalcode' in fieldinfos)) error='郵便番号';
				if (!('address1' in fieldinfos)) error='住所1';
				if (!('address2' in fieldinfos)) error='住所2';
				if (!('tel' in fieldinfos)) error='電話番号';
				if (!('mobile' in fieldinfos)) error='電話番号(携帯)';
				if (!('collecttrading' in fieldinfos)) error='支払方法';
				if (!('bankname' in fieldinfos)) error='銀行名';
				if (!('bankcode' in fieldinfos)) error='支店名';
				if (!('branchname' in fieldinfos)) error='銀行コード';
				if (!('branchcode' in fieldinfos)) error='支店コード';
				if (!('accounttype' in fieldinfos)) error='預金種別';
				if (!('accountno' in fieldinfos)) error='口座番号';
				if (!('accountname' in fieldinfos)) error='口座名義人(半角カナ)';
				break;
			case '12':
				/* 生徒情報 */
				if (!('name' in fieldinfos)) error='氏名';
				if (!('phonetic' in fieldinfos)) error='氏名かな';
				if (!('mail' in fieldinfos)) error='メールアドレス';
				if (!('question' in fieldinfos)) error='秘密の質問';
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
				if (!('shortterm1over' in fieldinfos)) error='短期講座追加時間';
				if (!('shortterm1bill' in fieldinfos)) error='短期講座請求済';
				if (!('shortterm2code' in fieldinfos)) error='テスト対策講座コースコード';
				if (!('shortterm2id' in fieldinfos)) error='テスト対策講座ID';
				if (!('shortterm2over' in fieldinfos)) error='テスト対策講座追加時間';
				if (!('shortterm2bill' in fieldinfos)) error='テスト対策講座請求済';
				if (!('shortterm3code' in fieldinfos)) error='英検対策講座コースコード';
				if (!('shortterm3id' in fieldinfos)) error='英検対策講座ID';
				if (!('shortterm3over' in fieldinfos)) error='英検対策講座追加時間';
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
				if (!('entrancefee' in fieldinfos)) error='入塾費';
				if (!('discountfee' in fieldinfos)) error='兄弟割引';
				if (!('textbookfee' in fieldinfos)) error='通常講座教材費';
				if (!('textbookbillmonths' in fieldinfos)) error='通常講座教材費請求月';
				if (!('taxshift' in fieldinfos)) error='税転嫁';
				if (!('taxround' in fieldinfos)) error='税端数';
				break;
			case '14':
				/* 消費税 */
				if (!('date' in fieldinfos)) error='施行日';
				if (!('rate' in fieldinfos)) error='税率';
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
	checkinvoicefield:function(properties){
		var error='';
		var fieldinfos=$.fieldparallelize(properties);
		if (!('billdate' in fieldinfos)) error='請求日';
		if (!('customer' in fieldinfos)) error='保護者番号';
		if (!('customername' in fieldinfos)) error='保護者氏名';
		if (!('subbill' in fieldinfos)) error='小計';
		if (!('tax' in fieldinfos)) error='消費税';
		if (!('bill' in fieldinfos)) error='請求金額';
		if (!('collectdate' in fieldinfos)) error='入金日';
		if (!('collecttrading' in fieldinfos)) error='入金方法';
		if (!('collect' in fieldinfos)) error='入金金額';
		if (!('remaining' in fieldinfos)) error='請求残';
		if (!('billtable' in properties)) error='請求テーブル';
		if (error.length!=0)
		{
			swal('Error!','請求アプリ内に'+error+'フィールドが見つかりません。','error');
			return false;
		}
		else return true;
	}
});
})(jQuery);
