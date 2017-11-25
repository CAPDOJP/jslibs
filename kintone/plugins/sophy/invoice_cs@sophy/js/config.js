/*
*--------------------------------------------------------------------
* jQuery-Plugin "invoice -config.js-"
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
		offset:0,
		lecturetable:null
	};
	var VIEW_NAME=['請求書作成'];
	var functions={
		loadapps:function(callback){
			kintone.api(kintone.api.url('/k/v1/apps',true),'GET',{offset:vars.offset},function(resp){
				/* setup app lists */
				$.each(resp.apps,function(index,values){
					if (values.appId!=kintone.app.getId())
					{
						$('select#lecture').append($('<option>').attr('value',values.appId).text(values.name));
						$('select#const').append($('<option>').attr('value',values.appId).text(values.name));
						$('select#tax').append($('<option>').attr('value',values.appId).text(values.name));
						$('select#grade').append($('<option>').attr('value',values.appId).text(values.name));
						$('select#parent').append($('<option>').attr('value',values.appId).text(values.name));
						$('select#student').append($('<option>').attr('value',values.appId).text(values.name));
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
		kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
			var config=kintone.plugin.app.getConfig(PLUGIN_ID);
			/* initialize valiable */
			vars.lecturetable=$('.lectures').adjustabletable();
			var add=false;
			var row=null;
			var lectures=[];
			var lecturenames=$.lecturenames();
			for (var i=0;i<lecturenames.length;i++)
			{
				if (i!=0) vars.lecturetable.addrow();
				row=vars.lecturetable.rows.last();
				$('span.lecturename',row).text(lecturenames[i]);
			}
			if (Object.keys(config).length!==0)
			{
				lectures=JSON.parse(config['lecture']);
				$('select#const').val(config['const']);
				$('select#tax').val(config['tax']);
				$('select#grade').val(config['grade']);
				$('select#parent').val(config['parent']);
				$('select#student').val(config['student']);
				for (var i=0;i<lectures.length;i++)
				{
					row=vars.lecturetable.rows.eq(i);
					if (row) $('select#lecture',row).val(lectures[i].code);
				}
			}
		},function(error){});
	});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var error=false;
		var row=null;
		var config=[];
		var lectures=[];
		/* check values */
		if ($('select#const').val()=='')
		{
			swal('Error!','基本情報アプリを選択して下さい。','error');
			return;
		}
		if ($('select#tax').val()=='')
		{
			swal('Error!','消費税アプリを選択して下さい。','error');
			return;
		}
		if ($('select#grade').val()=='')
		{
			swal('Error!','学年アプリを選択して下さい。','error');
			return;
		}
		if ($('select#parent').val()=='')
		{
			swal('Error!','保護者アプリを選択して下さい。','error');
			return;
		}
		if ($('select#student').val()=='')
		{
			swal('Error!','生徒情報アプリを選択して下さい。','error');
			return;
		}
		for (var i=0;i<vars.lecturetable.rows.length;i++)
		{
			var row=vars.lecturetable.rows.eq(i);
			if ($('select#lecture',row).val()=='')
			{
				swal('Error!','講座アプリを選択して下さい。','error');
				error=true;
			}
			lectures.push({code:$('select#lecture',row).val().toString(),name:$('span.lecturename',row).text()});
		}
	    if (error) return;
		/* setup config */
		config['const']=$('select#const').val();
		config['tax']=$('select#tax').val();
		config['grade']=$('select#grade').val();
		config['parent']=$('select#parent').val();
		config['student']=$('select#student').val();
		config['lecture']=JSON.stringify(lectures);
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