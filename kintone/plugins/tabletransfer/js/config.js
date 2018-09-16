/*
*--------------------------------------------------------------------
* jQuery-Plugin "tabletransfer -config.js-"
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
		app:{
			table:null,
			copyinfos:[]
		},
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
					if (values.appId!=kintone.app.getId()) $('select#app').append($('<option>').attr('value',values.appId).text(values.name));
				})
				vars.offset+=100;
				if (resp.apps.length==100) functions.loadapps(callback);
				else
				{
					if (callback!=null) callback();
				}
			},function(error){swal('Error!',error.message,'error');});
		},
		reloadfields:function(copyinfo,callback){
			/* clear rows */
			var target=$('select#app',copyinfo.container);
			copyinfo.fieldinfos={};
			copyinfo.table.clearrows();
			if (target.val().length!=0)
			{
				kintone.api(kintone.api.url('/k/v1/app/form/layout',true),'GET',{app:target.val()},function(resp){
					var sorted=functions.fieldsort(resp.layout);
					/* get fieldinfo */
					kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:target.val()},function(resp){
						var mappings=[];
						var fieldlist=$('select#fieldto',copyinfo.table.template).html('<option value=""></option>');
						copyinfo.fieldinfos=resp.properties;
						/* append lookup mappings fields */
						$.each(copyinfo.fieldinfos,function(key,values){
							if (values.lookup)
								$.each(values.lookup.fieldMappings,function(index,values){
									mappings.push(values.field);
								});
						});
						$.each(sorted,function(index){
							if (sorted[index] in copyinfo.fieldinfos)
							{
								var fieldinfo=copyinfo.fieldinfos[sorted[index]];
								/* check field type */
								switch (fieldinfo.type)
								{
									case 'CALC':
									case 'CATEGORY':
									case 'CREATED_TIME':
									case 'CREATOR':
									case 'MODIFIER':
									case 'RECORD_NUMBER':
									case 'REFERENCE_TABLE':
									case 'STATUS':
									case 'STATUS_ASSIGNEE':
									case 'UPDATED_TIME':
										break;
									default:
										if (!fieldinfo.expression)
											if ($.inArray(fieldinfo.code,mappings)<0) fieldlist.append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								}
							}
						});
						$('input#buttonlabel',copyinfo.container).val($('select#app option:selected',copyinfo.container).text()+'へコピー');
						copyinfo.table.addrow();
						$('.container',copyinfo.container).show();
						if (callback) callback();
					},function(error){
						$('input#buttonlabel',copyinfo.container).val('');
						$('.container',copyinfo.container).hide();
					});
				},function(error){
					$('input#buttonlabel',copyinfo.container).val('');
					$('.container',copyinfo.container).hide();
				});
			}
			else
			{
				$('input#buttonlabel',copyinfo.container).val('');
				$('.container',copyinfo.container).hide();
			}
		}
	};
	/*---------------------------------------------------------------
	 initialize fields
	---------------------------------------------------------------*/
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
					switch (fieldinfo.type)
					{
						case 'CATEGORY':
						case 'CREATED_TIME':
						case 'CREATOR':
						case 'MODIFIER':
						case 'REFERENCE_TABLE':
						case 'STATUS':
						case 'STATUS_ASSIGNEE':
						case 'UPDATED_TIME':
							break;
						default:
							$('select#fieldfrom').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
					}
				}
			});
			functions.loadapps(function(){
				/* initialize valiable */
				vars.app.table=$('.outer').adjustabletable({
					add:'img.addapp',
					del:'img.delapp',
					addcallback:function(row){
						var copyinfo={
							container:row,
							table:null,
							fieldinfos:{}
						};
						copyinfo.table=$('.inner',row).adjustabletable({
							add:'img.addfield',
							del:'img.delfield'
						});
						$('.container',row).hide();
						$('select#app',row).on('change',function(){
							functions.reloadfields(copyinfo);
						});
						vars.app.copyinfos.push(copyinfo);
					},
					delcallback:function(index){
						vars.app.copyinfos.splice(index,1);
					}
				});
				var row=null;
				var apps=[];
				if (Object.keys(config).length!==0)
				{
					apps=JSON.parse(config['apps']);
					for (var i=0;i<apps.length;i++)
					{
						if (i>0) vars.app.table.addrow();
						$('select#app',vars.app.table.rows.last()).val(apps[i]['app']);
						(function(copyinfo,config){
							functions.reloadfields(copyinfo,function(){
								$('input#buttonlabel',copyinfo.container).val(config.buttonlabel);
								for (var i2=0;i2<config.fields.length;i2++)
								{
									if (i2>0) copyinfo.table.addrow();
									row=copyinfo.table.rows.last();
									$('select#fieldfrom',row).val(config.fields[i2].from);
									$('select#fieldto',row).val(config.fields[i2].to);
								}
							});
						})(vars.app.copyinfos[i],apps[i]);
					}
				}
			});
		},function(error){swal('Error!',error.message,'error');});
	},function(error){swal('Error!',error.message,'error');});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var fieldinfo=null;
		var row=null;
		var config=[];
		var apps=[];
		/* check values */
		for (var i=0;i<vars.app.table.rows.length;i++)
		{
			var app={app:'',buttonlabel:'',tablecode:[],fields:[]};
			row=vars.app.table.rows.eq(i);
			if (!$('select#app',row).val()) continue;
			else app.app=$('select#app',row).val();
			if (!$('input#buttonlabel',row).val())
			{
				swal('Error!','コピーボタンラベルを入力して下さい。','error');
				return;
			}
			else app.buttonlabel=$('input#buttonlabel',row).val();
			for (var i2=0;i2<vars.app.copyinfos[i].table.rows.length;i2++)
			{
				row=vars.app.copyinfos[i].table.rows.eq(i2);
				if (!$('select#fieldfrom',row).val() && !$('select#fieldto',row).val()) continue;
				if (!$('select#fieldfrom',row).val() && $('select#fieldto',row).val())
				{
					swal('Error!','コピー元フィールドを選択して下さい。','error');
					return;
				}
				if ($('select#fieldfrom',row).val() && !$('select#fieldto',row).val())
				{
					swal('Error!','コピー先フィールドを選択して下さい。','error');
					return;
				}
				if (!$.isvalidtype(vars.fieldinfos[$('select#fieldfrom',row).val()],vars.app.copyinfos[i].fieldinfos[$('select#fieldto',row).val()]))
				{
					swal('Error!','コピーフィールドに指定したフィールド同士の形式が一致しません。','error');
					return;
				}
				if (vars.fieldinfos[$('select#fieldfrom',row).val()].tablecode)
					if (app.tablecode.indexOf(vars.fieldinfos[$('select#fieldfrom',row).val()].tablecode))
						app.tablecode.push(vars.fieldinfos[$('select#fieldfrom',row).val()].tablecode);
				app.fields.push({
					from:$('select#fieldfrom',row).val(),
					to:$('select#fieldto',row).val()
				});
			}
			if (app.tablecode.length>1)
			{
				swal('Error!','複数テーブルからの一括コピーは出来ません。','error');
				return;
			}
			else app.tablecode=app.tablecode.join('');
			apps.push(app);
		}
		/* setup config */
		config['apps']=JSON.stringify(apps,'');
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);