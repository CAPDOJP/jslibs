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
		loadviews:function(row,callback){
			var graphs=[];
			var views=[];
			$('select#view',row).empty();
			$('select#view',row).append($('<option>').attr('value','').html('表示一覧を選択'));
			if ($('select#app',row).val())
			{
				kintone.api(kintone.api.url('/k/v1/app/views',true),'GET',{app:$('select#app',row).val()},function(resp){
					/* setup view lists */
					$.each(resp.views,function(key,values){
						views.push({
							index:values.index,
							id:values.id,
							name:values.name
						});
					});
					views.sort(function(a,b){
						if(a.index<b.index) return -1;
						if(a.index>b.index) return 1;
						return 0;
					});
					for (var i=0;i<views.length;i++) $('select#view',row).append($('<option>').attr('value',views[i].id).text(views[i].name));
					if (callback) callback();
				});
			}
			else
			{
				if (callback) callback();
			}
		}
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
						del:'img.delapp',
						addcallback:function(row){
							$('select#app',row).on('change',function(){functions.loadviews(row)});
						}
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
			if (config['addothers']=='1') $('input#addothers').prop('checked',true);
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
					$('select#app',rowapps).val(category.apps[i2].app.id);
					(function(row,view){
						functions.loadviews(row,function(){
							$('select#view',row).val(view);
						});
					})(rowapps,category.apps[i2].view.id)
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
					if (!$('select#app',row).val()) continue;
					apps.push({
						app:{
							id:$('select#app',row).val(),
							name:$('select#app option:selected',row).text()
						},
						view:{
							id:$('select#view',row).val(),
							name:$('select#view option:selected',row).text()
						}
					});
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
		config['addothers']=($('input#addothers').prop('checked'))?'1':'0';
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