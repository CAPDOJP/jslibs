/*
*--------------------------------------------------------------------
* jQuery-Plugin "facilitatorcomment -config.js-"
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
		offset:0,
		fieldinfos:{}
	};
	var VIEW_NAME=['ファシリテーターコメント入力'];
	var functions={
		fieldsort:function(layout){
			var codes=[];
			$.each(layout,function(index,values){
				switch (values.type)
				{
					case 'ROW':
						$.each(values.fields,function(index,values){
							/* exclude spacer */
							if (!values.elementId) codes.push(values.code);
						});
						break;
					case 'GROUP':
						$.merge(codes,functions.fieldsort(values.layout));
						break;
					case 'SUBTABLE':
						$.each(values.fields,function(index,values){
							/* exclude spacer */
							if (!values.elementId) codes.push(values.code);
						});
						break;
				}
			});
			return codes;
		},
		loadapps:function(callback){
			kintone.api(kintone.api.url('/k/v1/apps',true),'GET',{offset:vars.offset},function(resp){
				/* setup app lists */
				$.each(resp.apps,function(index,values){
					if (values.appId!=kintone.app.getId()) $('select#history').append($('<option>').attr('value',values.appId).text(values.name));
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
		kintone.api(kintone.api.url('/k/v1/app/form/layout',true),'GET',{app:kintone.app.getId()},function(resp){
			var sorted=functions.fieldsort(resp.layout);
			/* get fieldinfo */
			kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
				var config=kintone.plugin.app.getConfig(PLUGIN_ID);
				vars.fieldinfos=$.fieldparallelize(resp.properties);
				$.each(sorted,function(index){
					if (sorted[index] in vars.fieldinfos)
					{
						var fieldinfo=vars.fieldinfos[sorted[index]];
						/* check field type */
						if (fieldinfo.tablecode.length==0)
							switch (fieldinfo.type)
							{
								case 'NUMBER':
								case 'SINGLE_LINE_TEXT':
									if (fieldinfo.lookup) $('select#facilitator').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
									break;
								case 'MULTI_LINE_TEXT':
									$('select#facilitatorcomment').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
									break;
							}
					}
				});
				var add=false;
				var row=null;
				if (Object.keys(config).length!==0)
				{
					$('select#history').val(config['history']);
					$('select#facilitator').val(config['facilitator']);
					$('select#facilitatorcomment').val(config['facilitatorcomment']);
				}
			},function(error){});
		},function(error){});
	});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var row=null;
		var config=[];
		/* check values */
		if ($('select#history').val()=='')
		{
			swal('Error!','受講履歴アプリを選択して下さい。','error');
			return;
		}
		if ($('select#facilitator').val().length==0)
		{
			swal('Error!','ファシリテーター指定フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#facilitatorcomment').val().length==0)
		{
			swal('Error!','ファシリテーターコメントフィールドを選択して下さい。','error');
			return;
		}
		/* setup config */
		config['history']=$('select#history').val();
		config['facilitator']=$('select#facilitator').val();
		config['facilitatorcomment']=$('select#facilitatorcomment').val();
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
						html:'<div id="facilitatorcomment-container" class="customview-container"></div>',
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
				config['facilitatorslist']=resp.views[VIEW_NAME[0]].id;
				/* save config */
				kintone.plugin.app.setConfig(config);
			},function(error){});
		},function(error){});
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);