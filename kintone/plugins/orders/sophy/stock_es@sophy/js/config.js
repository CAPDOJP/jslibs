/*
*--------------------------------------------------------------------
* jQuery-Plugin "stock -config.js-"
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
	var VIEW_NAME=['テキスト在庫一覧'];
	var functions={
		loadapps:function(callback){
			kintone.api(kintone.api.url('/k/v1/apps',true),'GET',{offset:vars.offset},function(resp){
				/* setup app lists */
				$.each(resp.apps,function(index,values){
					if (values.appId!=kintone.app.getId())
					{
						$('select#textbook').append($('<option>').attr('value',values.appId).text(values.name));
						$('select#lecture').append($('<option>').attr('value',values.appId).text(values.name));
						$('select#order').append($('<option>').attr('value',values.appId).text(values.name));
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
		$('select#textbook').val(config['textbook']);
		$('select#lecture').val(config['lecture']);
		$('select#order').val(config['order']);
	});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var config=[];
		/* check values */
		if ($('select#textbook').val()=='')
		{
			swal('Error!','受講テキストアプリを選択して下さい。','error');
			return;
		}
		if ($('select#lecture').val()=='')
		{
			swal('Error!','洋書テキスト選択アプリを選択して下さい。','error');
			return;
		}
		if ($('select#order').val()=='')
		{
			swal('Error!','テキスト発注者アプリを選択して下さい。','error');
			return;
		}
		/* setup config */
		config['textbook']=$('select#textbook').val();
		config['lecture']=$('select#lecture').val();
		config['order']=$('select#order').val();
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
						html:'<div id="stock-container" class="customview-container"></div>',
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
				config['stocklist']=resp.views[VIEW_NAME[0]].id;
				/* save config */
				kintone.plugin.app.setConfig(config);
			},function(error){});
		},function(error){});
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);