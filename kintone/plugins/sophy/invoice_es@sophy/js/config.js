/*
*--------------------------------------------------------------------
* jQuery-Plugin "invoice -config.js-"
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
	var vars={
		offset:0
	};
	var VIEW_NAME=['請求書作成'];
	var functions={
		loadapps:function(callback){
			kintone.api(kintone.api.url('/k/v1/apps',true),'GET',{offset:vars.offset},function(resp){
				/* setup app lists */
				$.each(resp.apps,function(index,values){
					if (values.appId!=kintone.app.getId())
					{
						$('select#const').append($('<option>').attr('value',values.appId).text(values.name));
						$('select#student').append($('<option>').attr('value',values.appId).text(values.name));
						$('select#lecture').append($('<option>').attr('value',values.appId).text(values.name));
						$('select#event').append($('<option>').attr('value',values.appId).text(values.name));
						$('select#item').append($('<option>').attr('value',values.appId).text(values.name));
					}
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
		var config=kintone.plugin.app.getConfig(PLUGIN_ID);
		$('select#const').val(config['const']);
		$('select#student').val(config['student']);
		$('select#lecture').val(config['lecture']);
		$('select#event').val(config['event']);
		$('select#item').val(config['item']);
	});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var config=[];
		/* check values */
		if ($('select#const').val()=='')
		{
			swal('Error!','基本情報アプリを選択して下さい。','error');
			return;
		}
		if ($('select#student').val()=='')
		{
			swal('Error!','生徒情報アプリを選択して下さい。','error');
			return;
		}
		if ($('select#lecture').val()=='')
		{
			swal('Error!','洋書テキスト選択アプリを選択して下さい。','error');
			return;
		}
		if ($('select#event').val()=='')
		{
			swal('Error!','イベント参加者アプリを選択して下さい。','error');
			return;
		}
		if ($('select#item').val()=='')
		{
			swal('Error!','備品販売アプリを選択して下さい。','error');
			return;
		}
		/* setup config */
		config['const']=$('select#const').val();
		config['student']=$('select#student').val();
		config['lecture']=$('select#lecture').val();
		config['event']=$('select#event').val();
		config['item']=$('select#item').val();
		/* get view lists */
		kintone.api(kintone.api.url('/k/v1/preview/app/views',true),'GET',{app:kintone.app.getId()},function(resp){
			var req=$.extend(true,{},resp);
			req.app=kintone.app.getId();
			$.each(VIEW_NAME,function(index){
				if (!req.views[VIEW_NAME[index]])
				{
					/* swaps the index */
					$.each(req.views,function(key,values){
						if ($.inArray(key,VIEW_NAME)<0) values.index=Number(values.index)+1;
					})
		   			/* create custom view */
					req.views[VIEW_NAME[index]]={
						type:'CUSTOM',
						name:VIEW_NAME[index],
						html:'<div id="invoice-container" class="customview-container"></div>',
						filterCond:'',
						sort:'',
						pager:false,
						index:index
					};
				}
			});
			/* save viewid */
			kintone.api(kintone.api.url('/k/v1/preview/app/views',true),'PUT',req,function(resp){
				/* setup config */
				config['createinvoice']=resp.views[VIEW_NAME[0]].id;
				/* save config */
				kintone.plugin.app.setConfig(config);
			},function(error){});
		},function(error){});
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);