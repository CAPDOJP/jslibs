/*
*--------------------------------------------------------------------
* jQuery-Plugin "applist -config.js-"
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
		categorytable:null,
		apptable:[]
	};
	var VIEW_NAME=['アプリ一覧'];
	var functions={
		loadapps:function(callback){
			kintone.api(kintone.api.url('/k/v1/apps',true),'GET',{offset:vars.offset},function(resp){
				/* setup app lists */
				$.each(resp.apps,function(index,values){
					$('select#app').append($('<option>').attr('value',values.appId).text(values.name));
				})
				vars.offset+=100;
				if (resp.apps.length==100) functions.loadapps(callback);
				else callback();
			},function(error){});
		},
	};
	/*---------------------------------------------------------------
	 initialize fields
	---------------------------------------------------------------*/
	functions.loadapps(function(){
		var config=kintone.plugin.app.getConfig(PLUGIN_ID);
		/* initialize valiable */
		vars.categorytable=$('.categories').adjustabletable({
			add:'img.addcategory',
			del:'img.delcategory',
			addcallback:function(row){
				vars.apptable.push(
					$('.apps',row).adjustabletable({
						add:'img.addapp',
						del:'img.delapp'
					})
				);
			}
		});
		var addapps=false;
		var addcategories=false;
		var rowapps=null;
		var rowcategories=null;
		var categories=[];
		if (Object.keys(config).length!==0)
		{
			categories=JSON.parse(config['category']);
			for (var i=0;i<categories.length;i++)
			{
				var category=categories[i];
				if (addcategories) vars.categorytable.addrow();
				else addcategories=true;
				rowcategories=vars.categorytable.rows.last();
				$('input#category',rowcategories).val(category.name);
				addapps=false;
				for (var i2=0;i2<category.apps.length;i2++)
				{
					if (addapps) vars.apptable[i].addrow();
					else addapps=true;
					rowapps=vars.apptable[i].rows.eq(i2);
					$('select#app',rowapps).val(category.apps[i2]);
				}
			}
		}
	});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var row=null;
		var apps=[];
		var config=[];
		var categories=[];
		/* check values */
		for (var i=0;i<vars.categorytable.rows.length;i++)
			if ($('input#category',vars.categorytable.rows[i]).val()!='')
			{
				apps=[];
				for (var i2=0;i2<vars.apptable[i].rows.length;i2++)
				{
					row=vars.apptable[i].rows.eq(i2);
					if ($('select#app',row).val().length==0) continue;
					apps.push($('select#app',row).val());
				}
				if (apps.length==0)
				{
					swal('Error!','カテゴリー内アプリを指定して下さい。','error');
					return;
				}
				categories.push({
					name:$('input#category',vars.categorytable.rows[i]).val(),
					apps:apps
				});
			}
		/* setup config */
		config['category']=JSON.stringify(categories);
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
						html:'<div id="applist-container" class="customview-container"></div>',
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
				config['applist']=resp.views[VIEW_NAME[0]].id;
				/* save config */
				kintone.plugin.app.setConfig(config);
			},function(error){});
		},function(error){});
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);