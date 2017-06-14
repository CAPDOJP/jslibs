/*
*--------------------------------------------------------------------
* jQuery-Plugin "lookupexchange -config.js-"
* Version: 1.0
* Copyright (c) 2017 TIS
*
* Released under the MIT License.
* http://tis2010.jp/license.txt
* -------------------------------------------------------------------
*/
jQuery.noConflict();
(function($,PLUGIN_ID){
	"use strict";
	var vars={
		progress:null,
		apps:{},
		offset:{},
		fieldinfos:{},
		types:[
			'NUMBER',
			'SINGLE_LINE_TEXT'
		]
	};
	var limit=500;
	var functions={
		loaddatas:function(appkey,callback){
	        kintone.api(kintone.api.url('/k/v1/records',true),'GET',{app:appkey,query:'order by $id asc limit '+limit.toString()+' offset '+vars.offset[appkey].toString()},function(resp){
	        	if (vars.apps[appkey]==null) vars.apps[appkey]=resp.records;
	        	else Array.prototype.push.apply(vars.apps[appkey],resp.records);
				vars.offset[appkey]+=limit;
				if (resp.records.length==limit) functions.loaddatas(appkey,callback);
				else callback();
			},function(error){});
		}
	};
	/*---------------------------------------------------------------
	 initialize fields
	---------------------------------------------------------------*/
	vars.offset[kintone.app.getId()]=0;
	vars.progress=$('<div id="progress">')
	.append($('<div class="message">'))
	.append($('<div class="progressbar">').append($('<div class="progresscell">')));
	$('body').append(vars.progress);
	functions.loaddatas(kintone.app.getId(),function(){
		kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
			vars.fieldinfos=$.fieldparallelize(resp.properties);
			/* setup field lists */
			$.each(vars.fieldinfos,function(key,values){
				if ($.inArray(values.type,vars.types)>-1)
				{
					if (values.lookup)
					{
						$('select#fromlookupfrom').append($('<option>').attr('value',values.code).text(values.label));
						$('select#tolookupto').append($('<option>').attr('value',values.code).text(values.label));
					}
					else
					{
						$('select#fromlookupto').append($('<option>').attr('value',values.code).text(values.label));
						$('select#tolookupfrom').append($('<option>').attr('value',values.code).text(values.label));
					}
				}
			});
		},function(error){});
	});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var counter=0;
		var fromcode='';
		var tocode='';
		var regists=[];
		/* copy from lookup */
		if ($('select#fromlookupfrom').val())
		{
			if (!$('select#fromlookupto').val())
			{
				swal('Error!','コピー先の数値または文字列フィールドを選択して下さい。','error');
				return;
			}
			if (vars.fieldinfos[$('select#fromlookupfrom').val()].type!=vars.fieldinfos[$('select#fromlookupto').val()].type)
			{
				swal('Error!','コピーフィールド間のタイプが一致しません。','error');
				return;
			}
			if (vars.fieldinfos[$('select#fromlookupfrom').val()].tablecode!=vars.fieldinfos[$('select#fromlookupto').val()].tablecode)
			{
				swal('Error!','コピーフィールド間のテーブルコードが一致しません。','error');
				return;
			}
			fromcode=$('select#fromlookupfrom').val();
			tocode=$('select#fromlookupto').val();
			$.each(vars.apps[kintone.app.getId()],function(index){
				var record=vars.apps[kintone.app.getId()][index];
				var tablecode=vars.fieldinfos[fromcode].tablecode;
				var regist={id:null,record:{}};
				regist.id=record['$id'].value;
				if (tablecode.length!=0)
				{
					regist.record[tablecode]={value:[]};
					$.each(record[tablecode].value,function(index){
						var value=record[tablecode].value[index];
						value.value[tocode].value=record[tablecode].value[index].value[fromcode].value;
						regist.record[tablecode].value.push(value);
					});
				}
				else regist.record[tocode]={value:record[fromcode].value};
				regists.push(regist);
			});
		}
		/* copy to lookup */
		if ($('select#tolookupfrom').val())
		{
			if (!$('select#tolookupto').val())
			{
				swal('Error!','コピー先のルックアップフィールドを選択して下さい。','error');
				return;
			}
			if (vars.fieldinfos[$('select#tolookupfrom').val()].type!=vars.fieldinfos[$('select#tolookupto').val()].type)
			{
				swal('Error!','コピーフィールド間のタイプが一致しません。','error');
				return;
			}
			if (vars.fieldinfos[$('select#tolookupfrom').val()].tablecode!=vars.fieldinfos[$('select#tolookupto').val()].tablecode)
			{
				swal('Error!','コピーフィールド間のテーブルコードが一致しません。','error');
				return;
			}
			fromcode=$('select#tolookupfrom').val();
			tocode=$('select#tolookupto').val();
			$.each(vars.apps[kintone.app.getId()],function(index){
				var record=vars.apps[kintone.app.getId()][index];
				var tablecode=vars.fieldinfos[fromcode].tablecode;
				var regist={id:null,record:{}};
				regist.id=record['$id'].value;
				if (tablecode.length!=0)
				{
					regist.record[tablecode]={value:[]};
					$.each(record[tablecode].value,function(index){
						var value=record[tablecode].value[index];
						value.value[tocode].value=record[tablecode].value[index].value[fromcode].value;
						regist.record[tablecode].value.push(value);
					});
				}
				else regist.record[tocode]={value:record[fromcode].value};
				regists.push(regist);
			});
		}
		if (regists.length!=0)
		{
			vars.progress.find('.message').text('コピーしています');
			vars.progress.show();
			$.each(regists,function(index){
				kintone.api(kintone.api.url('/k/v1/record',true),'PUT',{app:kintone.app.getId(),id:regists[index].id,record:regists[index].record},function(resp){
					counter++;
					if (counter==regists.length) history.back();
					vars.progress.find('.progressbar').find('.progresscell').width(vars.progress.find('.progressbar').innerWidth()*(counter/regists.length));
				},function(error){
					vars.progress.hide();
			    	swal('Error!',error.message,'error');
				});
			});
		}
	});
    $('button#cancel').on('click',function(e){
        history.back();
    });
})(jQuery,kintone.$PLUGIN_ID);