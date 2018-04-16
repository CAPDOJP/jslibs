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
		offset:0,
		apptable:null,
		appparams:[],
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
			},function(error){});
		},
		reloadfields:function(params,callback){
			/* clear rows */
			var target=$('select#app',params.container);
			params.fieldinfos={};
			params.fields.clearrows();
			if (target.val().length!=0)
			{
				var fieldinfo=null;
				kintone.api(kintone.api.url('/k/v1/app/form/layout',true),'GET',{app:target.val()},function(resp){
					var sorted=functions.fieldsort(resp.layout);
					/* get fieldinfo */
					kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:target.val()},function(resp){
						var mappings=[];
						var fieldlist=$('select#fieldto',params.fields.template).html('<option value=""></option>');
						params.fieldinfos=$.fieldparallelize(resp.properties);
						/* append lookup mappings fields */
						$.each(params.fieldinfos,function(key,values){
							if (values.lookup)
								$.each(values.lookup.fieldMappings,function(index,values){
									mappings.push(values.field);
								});
						});
						$.each(sorted,function(index){
							if (sorted[index] in params.fieldinfos)
							{
								fieldinfo=params.fieldinfos[sorted[index]];
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
						params.buttonlabel.val($('select#app option:selected',params.container).text()+'へコピー');
						params.fields.addrow();
						$('.container',params.container).show();
						if (callback) callback();
					},function(error){
						params.buttonlabel.val('');
						$('.container',params.container).hide();
					});
				},function(error){
					params.buttonlabel.val('');
					$('.container',params.container).hide();
				});
			}
			else
			{
				params.buttonlabel.val('');
				$('.container',params.container).hide();
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
				vars.apptable=$('.apps').adjustabletable({
					add:'img.addapp',
					del:'img.delapp',
					addcallback:function(row){
						var index=(vars.apptable)?vars.apptable.rows.index(row):0;
						vars.appparams.push({
							buttonlabel:$('input#buttonlabel',row),
							container:row,
							fieldinfos:{},
							fields:$('.fields',row).adjustabletable({
								add:'img.addfield',
								del:'img.delfield'
							})
						});
						$('.container',row).hide();
						$('select#app',row).on('change',function(){
							functions.reloadfields(vars.appparams[index]);
						});
					},
					delcallback:function(index){
						vars.appparams.splice(index,1);
					}
				});
				var add=false;
				var row=null;
				var apps=[];
				if (Object.keys(config).length!==0)
				{
					apps=JSON.parse(config['apps']);
					for (var i=0;i<apps.length;i++)
					{
						if (add) vars.apptable.addrow();
						else add=true;
						$('select#app',vars.apptable.rows.last()).val(apps[i]['app']);
						(function(params,buttonlabel,fields){
							functions.reloadfields(params,function(){
								params.buttonlabel.val(buttonlabel);
								add=false;
								for (var i2=0;i2<fields.length;i2++)
								{
									if (add) params.fields.addrow();
									else add=true;
									row=params.fields.rows.last();
									$('select#fieldfrom',row).val(fields[i2].from);
									$('select#fieldto',row).val(fields[i2].to);
								}
							});
						})(vars.appparams[i],apps[i]['buttonlabel'],apps[i]['fields']);
					}
				}
				else $('.container',vars.appparams[0].container).hide();
			});
		},function(error){});
	},function(error){});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var fieldinfo=null;
		var row=null;
		var config=[];
		var apps=[];
		/* check values */
		for (var i=0;i<vars.appparams.length;i++)
		{
			var app={app:'',buttonlabel:'',fields:[]};
			row=vars.appparams[i].container;
			if ($('select#app',row).val()=='') continue;
			else app.app=$('select#app',row).val();
			if ($('input#buttonlabel',row).val()=='')
			{
				swal('Error!','コピーボタンラベルを入力して下さい。','error');
				return;
			}
			else app.buttonlabel=$('input#buttonlabel',row).val();
			for (var i2=0;i2<vars.appparams[i].fields.rows.length;i2++)
			{
				row=vars.appparams[i].fields.rows.eq(i2);
				if ($('select#fieldfrom',row).val()=='')
				{
					swal('Error!','コピー元フィールドを選択して下さい。','error');
					return;
				}
				if ($('select#fieldto',row).val()=='')
				{
					swal('Error!','コピー先フィールドを選択して下さい。','error');
					return;
				}
				if (!$.isvalidtype(vars.fieldinfos[$('select#fieldfrom',row).val()],vars.appparams[i].fieldinfos[$('select#fieldto',row).val()]))
				{
					swal('Error!','コピーフィールドに指定したフィールド同士の形式が一致しません。','error');
					return;
				}
				if (vars.fieldinfos[$('select#fieldfrom',row).val()].tablecode!=vars.appparams[i].fieldinfos[$('select#fieldto',row).val()].tablecode)
				{
					swal('Error!','テーブル内フィールドの指定は同一フィールドコードのテーブルにして下さい。','error');
					return;
				}
				app.fields.push({
					from:$('select#fieldfrom',row).val(),
					to:$('select#fieldto',row).val()
				});
			}
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