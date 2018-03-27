/*
*--------------------------------------------------------------------
* jQuery-Plugin "referenceupdate -config.js-"
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
						vars.groups.push(values.code);
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
		reloadsettings:function(params,callback){
			/* clear rows */
			var target=$('select#app',params.container);
			params.fieldinfos={};
			params.keys.clearrows();
			params.values.clearrows();
			if (target.val().length!=0)
			{
				var fieldinfo=null;
				kintone.api(kintone.api.url('/k/v1/app/form/layout',true),'GET',{app:target.val()},function(resp){
					var sorted=functions.fieldsort(resp.layout);
					/* get fieldinfo */
					kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:target.val()},function(resp){
						var mappings=[];
						var keylist=$('select#keyto',params.keys.template).html('<option value=""></option>');
						var valuelist=$('select#valueto',params.values.template).html('<option value=""></option>');
						/* append lookup mappings fields */
						$.each(resp.properties,function(key,values){
							if (values.lookup)
								$.each(values.lookup.fieldMappings,function(index,values){
									mappings.push(values.field);
								});
						});
						$.each(sorted,function(index){
							if (sorted[index] in resp.properties)
							{
								fieldinfo=resp.properties[sorted[index]];
								/* check field type */
								switch (fieldinfo.type)
								{
									case 'CALC':
									case 'RADIO_BUTTON':
									case 'RECORD_NUMBER':
										keylist.append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
										break;
									case 'CATEGORY':
									case 'CREATED_TIME':
									case 'CREATOR':
									case 'FILE':
									case 'MODIFIER':
									case 'REFERENCE_TABLE':
									case 'STATUS':
									case 'STATUS_ASSIGNEE':
									case 'UPDATED_TIME':
										break;
									default:
										if (fieldinfo.required) keylist.append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
										if ($.inArray(fieldinfo.code,mappings)<0) valuelist.append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								}
								params.fieldinfos[sorted[index]]=resp.properties[sorted[index]];
							}
						});
						params.keys.addrow();
						params.keys.container.show();
						params.values.addrow();
						params.values.container.show();
						if (callback) callback();
					},function(error){
						params.keys.container.hide();
						params.values.container.hide();
					});
				},function(error){
					params.keys.container.hide();
					params.values.container.hide();
				});
			}
			else
			{
				params.keys.container.hide();
				params.values.container.hide();
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
			$.each(sorted,function(index){
				if (sorted[index] in resp.properties)
				{
					var fieldinfo=resp.properties[sorted[index]];
					/* check field type */
					switch (fieldinfo.type)
					{
						case 'CALC':
						case 'RADIO_BUTTON':
						case 'RECORD_NUMBER':
							$('select#keyfrom').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							$('select#valuefrom').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
						case 'CATEGORY':
						case 'CREATED_TIME':
						case 'CREATOR':
						case 'FILE':
						case 'MODIFIER':
						case 'REFERENCE_TABLE':
						case 'STATUS':
						case 'STATUS_ASSIGNEE':
						case 'UPDATED_TIME':
							break;
						default:
							if (fieldinfo.required) $('select#keyfrom').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							$('select#valuefrom').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
					}
					vars.fieldinfos[sorted[index]]=resp.properties[sorted[index]];
				}
			});
			/* initialize valiable */
			vars.apptable=$('.apps').adjustabletable({
				add:'img.addapp',
				del:'img.delapp',
				addcallback:function(row){
					var index=(vars.apptable)?vars.apptable.rows.index(row):0;
					vars.appparams.push({
						container:row,
						fieldinfos:{},
						keys:$('.keys',row).adjustabletable({
							add:'img.addkey',
							del:'img.delkey'
						}),
						values:$('.values',row).adjustabletable({
							add:'img.addvalue',
							del:'img.delvalue'
						})
					});
					$('select#app',row).on('change',function(){
						functions.reloadsettings(vars.appparams[index]);
					});
				},
				delcallback:function(index){
					vars.appparams.splice(index,1);
				}
			});
			functions.loadapps(function(){
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
						(function(params,settings){
							functions.reloadsettings(params,function(){
								add=false;
								for (var i2=0;i2<settings.keys.length;i2++)
								{
									if (add) params.keys.addrow();
									else add=true;
									row=params.keys.rows.last();
									$('select#keyfrom',row).val(settings.keys[i2].from);
									$('select#keyto',row).val(settings.keys[i2].to);
								}
								add=false;
								for (var i2=0;i2<settings.values.length;i2++)
								{
									if (add) params.values.addrow();
									else add=true;
									row=params.values.rows.last();
									$('select#valuefrom',row).val(settings.values[i2].from);
									$('select#valueto',row).val(settings.values[i2].to);
								}
							});
						})(vars.appparams[i],apps[i]['setting']);
					}
				}
				else
				{
					vars.appparams[0].keys.container.hide();
					vars.appparams[0].values.container.hide();
				}
			});
		},function(error){});
	},function(error){});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var row=null;
		var config=[];
		var apps=[];
		/* check values */
		for (var i=0;i<vars.appparams.length;i++)
		{
			var app={app:'',setting:{keys:[],values:[]}};
			row=vars.appparams[i].container;
			if ($('select#app',row).val()=='') continue;
			else app.app=$('select#app',row).val();
			for (var i2=0;i2<vars.appparams[i].keys.rows.length;i2++)
			{
				row=vars.appparams[i].keys.rows.eq(i2);
				if ($('select#keyfrom',row).val()=='')
				{
					swal('Error!','更新元キーフィールドを選択して下さい。','error');
					return;
				}
				if ($('select#keyto',row).val()=='')
				{
					swal('Error!','更新先キーフィールドを選択して下さい。','error');
					return;
				}
				if (!$.isvalidtype(vars.fieldinfos[$('select#keyfrom',row).val()],vars.appparams[i].fieldinfos[$('select#keyto',row).val()]))
				{
					swal('Error!','更新キーフィールドに指定したフィールド同士の形式が一致しません。','error');
					return;
				}
				app.setting.keys.push({
					from:$('select#keyfrom',row).val(),
					to:$('select#keyto',row).val(),
					type:vars.appparams[i].fieldinfos[$('select#keyto',row).val()],
					format:((fieldinfo.type=='CALC')?fieldinfo.format:'')
				});
			}
			for (var i2=0;i2<vars.appparams[i].values.rows.length;i2++)
			{
				row=vars.appparams[i].values.rows.eq(i2);
				if ($('select#valuefrom',row).val()=='')
				{
					swal('Error!','更新元フィールドを選択して下さい。','error');
					return;
				}
				if ($('select#valueto',row).val()=='')
				{
					swal('Error!','更新先フィールドを選択して下さい。','error');
					return;
				}
				if (!$.isvalidtype(vars.fieldinfos[$('select#valuefrom',row).val()],vars.appparams[i].fieldinfos[$('select#valueto',row).val()]))
				{
					swal('Error!','更新フィールドに指定したフィールド同士の形式が一致しません。','error');
					return;
				}
				app.setting.values.push({
					from:$('select#valuefrom',row).val(),
					to:$('select#valueto',row).val()
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