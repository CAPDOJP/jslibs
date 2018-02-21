/*
*--------------------------------------------------------------------
* jQuery-Plugin "freeeresources -config.js-"
* Version: 1.0
* Copyright (c) 2018 TIS
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
				}
			});
			return codes;
		},
		loadapps:function(callback){
			kintone.api(kintone.api.url('/k/v1/apps',true),'GET',{offset:vars.offset},function(resp){
				/* setup app lists */
				$.each(resp.apps,function(index,values){
					if (values.appId!=kintone.app.getId())
						$.each($('.apps'),function(index){
							$(this).append($('<option>').attr('value',values.appId).text(values.name));
						})
				})
				vars.offset+=100;
				if (resp.apps.length==100) functions.loadapps(callback);
				else
				{
					if (callback!=null) callback();
				}
			},function(error){});
		},
		reloadapp:function(target,callback){
			var id=target.attr('id');
			var table=$('.'+id);
			$.each($('.fields',table),function(index){
				$(this).empty();
			});
			if (target.val().length!=0)
			{
				kintone.api(kintone.api.url('/k/v1/app/form/layout',true),'GET',{app:target.val()},function(resp){
					var sorted=functions.fieldsort(resp.layout);
					/* get fieldinfo */
					kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:target.val()},function(resp){
						var fieldinfos=resp.properties;
						/* initialize valiable */
						$.each(sorted,function(index){
							if (sorted[index] in fieldinfos)
							{
								var fieldinfo=fieldinfos[sorted[index]];
								/* check field type */
								switch (fieldinfo.type)
								{
									case 'NUMBER':
										$.each($('.number',table),function(index){
											$(this).append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
										});
										break;
									case 'SINGLE_LINE_TEXT':
										$.each($('.string',table),function(index){
											$(this).append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
										});
								}
							}
						});
						$('.'+id).show();
						if (callback) callback();
					});
				},function(error){});
			}
			else
			{
				$.each($('.fields',table),function(index){
					$(this).append($('<option>').attr('value','').text(''));
				});
				$('.'+id).hide();
			}
		}
	};
	/*---------------------------------------------------------------
	 initialize fields
	---------------------------------------------------------------*/
	functions.loadapps(function(){
		/* setup config */
		var config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (Object.keys(config).length!==0)
		{
			$('input#freeeappid').val(config['freeeappid']);
			$('input#freeesecret').val(config['freeesecret']);
			$.each($('.apps'),function(index){
				var id=$(this).attr('id');
				var table=$('.'+id);
				$(this).val(config[id+'app']);
				functions.reloadapp($(this),function(){
					var fields=JSON.parse(config[id+'fields']);
					$.each(fields,function(key,values){
						$('#'+key,table).val(values);
					});
				});
			})
		}
		else $.each($('.apps'),function(index){functions.reloadapp($(this),null);})
		/* events */
		$.each($('.apps'),function(index){
			$(this).on('change',function(){functions.reloadapp($(this),null)});
		})
	});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var config=[];
		/* setup config */
		$.each($('.apps'),function(index){
			var id=$(this).attr('id');
			var table=$('.'+id);
			var fields={};
			config[id+'app']=$(this).val();
			$.each($('.fields',table),function(index){
				fields[$(this).attr('id')]=$(this).val();
			});
			config[id+'fields']=JSON.stringify(fields);
		})
		config['freeeappid']=$('input#freeeappid').val();
		config['freeesecret']=$('input#freeesecret').val();
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);