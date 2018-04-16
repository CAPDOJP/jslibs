/*
*--------------------------------------------------------------------
* jQuery-Plugin "recordtransfer -config.js-"
* Version: 3.0
* Copyright (c) 2016 TIS
*
* Released under the MIT License.
* http://tis2010.jp/license.txt
* -------------------------------------------------------------------
*/
jQuery.noConflict();
(function($,PLUGIN_ID){
	"use strict";
	var vars={
		offset:0
	};
	var functions={
		loadapps:function(callback){
			kintone.api(kintone.api.url('/k/v1/apps',true),'GET',{offset:vars.offset},function(resp){
				/* setup app lists */
				$.each(resp.apps,function(index,values){
					if (values.appId!=kintone.app.getId())
						$('select#lecture').append($('<option>').attr('value',values.appId).text(values.name));
				})
				vars.offset+=100;
				if (resp.apps.length==100) functions.loadapps(callback);
				else
				{
					if (callback!=null) callback();
				}
			},function(error){});
		}
	};
	/*---------------------------------------------------------------
	 initialize fields
	---------------------------------------------------------------*/
	functions.loadapps(function(){
		/* get fieldinfo */
		kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
			var config=kintone.plugin.app.getConfig(PLUGIN_ID);
			$.each(resp.properties,function(key,values){
				/* check field type */
				switch (values.type)
				{
					case 'DATE':
						$('select#startmonth').append($('<option>').attr('value',values.code).text(values.label));
				}
			});
			if (Object.keys(config).length!==0)
			{
				$('select#startmonth').val(config['startmonth']);
				$('select#lecture').val(config['lecture']);
			}
		});
	});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var config=[];
		/* check values */
		if ($('select#startmonth').val()=='')
		{
			swal('Error!','受講開始月フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#lecture').val()=='')
		{
			swal('Error!','洋書テキスト選択アプリを選択して下さい。','error');
			return;
		}
		/* setup config */
		config['startmonth']=$('select#startmonth').val();
		config['lecture']=$('select#lecture').val();
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);