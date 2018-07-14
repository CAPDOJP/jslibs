/*
*--------------------------------------------------------------------
* jQuery-Plugin "lookupcopy -config.js-"
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
		settingtable:null,
		settingparams:[],
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
		reloadcopies:function(params,callback){
			/* clear rows */
			var target=$('select#lookup',params.container);
			params.fieldinfos={};
			params.copies.clearrows();
			if (target.val())
			{
				if (!vars.fieldinfos[target.val()].tablecode)
				{
					kintone.api(kintone.api.url('/k/v1/app/form/layout',true),'GET',{app:vars.fieldinfos[target.val()].lookup.relatedApp.app},function(resp){
						var sorted=functions.fieldsort(resp.layout);
						/* get fieldinfo */
						kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:vars.fieldinfos[target.val()].lookup.relatedApp.app},function(resp){
							var list=$('select#copyfrom',params.copies.template).empty().append($('<option>').attr('value','').text(''));
							params.fieldinfos=resp.properties;
							$.each(sorted,function(index){
								if (sorted[index] in params.fieldinfos)
								{
									var fieldinfo=params.fieldinfos[sorted[index]];
									/* check field type */
									switch (fieldinfo.type)
									{
										case 'CATEGORY':
										case 'CREATOR':
										case 'MODIFIER':
										case 'REFERENCE_TABLE':
										case 'STATUS':
										case 'STATUS_ASSIGNEE':
											break;
										default:
											list.append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
									}
								}
							});
							params.copies.addrow();
							$('.container',params.container).show();
							if (callback) callback();
						},function(error){$('.container',params.container).hide();});
					},function(error){$('.container',params.container).hide();});
				}
				else $('.container',params.container).hide();
			}
			else $('.container',params.container).hide();
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
			var mappings=[];
			/* append lookup mappings fields */
			vars.fieldinfos=$.fieldparallelize(resp.properties);
			$.each(vars.fieldinfos,function(key,values){
				if (values.lookup)
					$.each(values.lookup.fieldMappings,function(index,values){
						mappings.push(values.field);
					});
			});
			$.each(sorted,function(index){
				if (sorted[index] in vars.fieldinfos)
				{
					var fieldinfo=vars.fieldinfos[sorted[index]];
					/* check field type */
					switch (fieldinfo.type)
					{
						case 'SINGLE_LINE_TEXT':
							/* exclude lookup */
							if (!fieldinfo.lookup)
								if ($.inArray(fieldinfo.code,mappings)<0) $('select#connected').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
					}
					if (fieldinfo.lookup) $('select#lookup').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
					if (!fieldinfo.expression)
						if (fieldinfo.tablecode)
							if ($.inArray(fieldinfo.code,mappings)<0) $('select#copyto').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
				}
			});
			/* initialize valiable */
			vars.settingtable=$('.settings').adjustabletable({
				add:'img.addsetting',
				del:'img.delsetting',
				addcallback:function(row){
					var index=(vars.settingtable)?vars.settingtable.rows.index(row):0;
					vars.settingparams.push({
						container:row,
						fieldinfos:{},
						copies:$('.copies',row).adjustabletable({
							add:'img.addcopy',
							del:'img.delcopy'
						})
					});
					$('.container',row).hide();
					$('select#lookup',row).on('change',function(){
						functions.reloadcopies(vars.settingparams[index]);
					});
				},
				delcallback:function(index){
					vars.settingparams.splice(index,1);
				}
			});
			var row=null;
			var settings=[];
			if (Object.keys(config).length!==0)
			{
				settings=JSON.parse(config['settings']);
				for (var i=0;i<settings.length;i++)
				{
					if (i>0) vars.settingtable.addrow();
					$('select#lookup',vars.settingtable.rows.last()).val(settings[i].lookup);
					$('select#connected',vars.settingtable.rows.last()).val(settings[i].connected);
					(function(params,copies){
						functions.reloadcopies(params,function(){
							for (var i2=0;i2<copies.length;i2++)
							{
								if (i2>0) params.copies.addrow();
								row=params.copies.rows.last();
								$('select#copyfrom',row).val(copies[i2].copyfrom);
								$('select#copyto',row).val(copies[i2].copyto);
							}
						});
					})(vars.settingparams[i],settings[i]['copies']);
				}
			}
			else $('.container',vars.settingparams[0].container).hide();
		},function(error){});
	},function(error){});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var fieldinfo=null;
		var row=null;
		var config=[];
		var settings=[];
		/* check values */
		for (var i=0;i<vars.settingparams.length;i++)
		{
			var setting={lookup:'',connected:'',copies:[],tablecode:''};
			row=vars.settingparams[i].container;
			if (!$('select#lookup',row).val()) continue;
			if ($('select#connected',row).val())
				if (vars.fieldinfos[$('select#lookup',row).val()].tablecode!=vars.fieldinfos[$('select#connected',row).val()].tablecode)
				{
					swal('Error!','テーブル内フィールドの指定は同一テーブルにして下さい。','error');
					return;
				}
			setting.lookup=$('select#lookup',row).val();
			setting.connected=$('select#connected',row).val();
			for (var i2=0;i2<vars.settingparams[i].copies.rows.length;i2++)
			{
				row=vars.settingparams[i].copies.rows.eq(i2);
				if (!$('select#copyfrom',row).val() && $('select#copyto',row).val())
				{
					swal('Error!','コピー元フィールドを選択して下さい。','error');
					return;
				}
				if ($('select#copyfrom',row).val() && !$('select#copyto',row).val())
				{
					swal('Error!','コピー先フィールドを選択して下さい。','error');
					return;
				}
				if (!$('select#copyfrom',row).val()) continue;
				if (!$('select#copyto',row).val()) continue;
				if (!$.isvalidtype(vars.settingparams[i].fieldinfos[$('select#copyfrom',row).val()],vars.fieldinfos[$('select#copyto',row).val()]))
				{
					swal('Error!','コピーフィールドに指定したフィールド同士の形式が一致しません。','error');
					return;
				}
				if (setting.tablecode)
					if (setting.tablecode!=vars.fieldinfos[$('select#copyto',row).val()].tablecode)
					{
						swal('Error!','コピー先フィールドの指定は同一テーブルにして下さい。','error');
						return;
					}
				setting.tablecode=vars.fieldinfos[$('select#copyto',row).val()].tablecode;
				setting.copies.push({
					copyfrom:$('select#copyfrom',row).val(),
					copyto:$('select#copyto',row).val()
				});
			}
			settings.push(setting);
		}
		/* setup config */
		config['settings']=JSON.stringify(settings);
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);