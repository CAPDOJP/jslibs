/*
*--------------------------------------------------------------------
* jQuery-Plugin "itemlinked -config.js-"
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
		fieldtable:null,
		fieldparams:[],
		groups:[],
		fieldinfos:{},
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
		reloadsettings:function(params,callback){
			/* clear rows */
			var target=$('select#field',params.table.container.closest('tr'));
			params.autos=[];
			params.groups=[];
			params.requires=[];
			params.table.clearrows();
			if (target.val().length!=0)
			{
				var fieldinfo=vars.fieldinfos[target.val()];
				var options=[fieldinfo.options.length];
				$.each(fieldinfo.options,function(key,values){
					options[values.index]=values.label;
				});
				for (var i=0;i<options.length;i++)
				{
					params.table.addrow();
					params.table.rows.last().find('input#item').val(options[i]);
					params.table.rows.last().find('span.itemname').text(options[i]);
				}
				params.table.container.show();
				if (callback) callback();
			}
			else params.table.container.hide();
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
			/* append lookup mappings fields and group fields */
			$.each(resp.properties,function(key,values){
				if (values.lookup)
					$.each(values.lookup.fieldMappings,function(index,values){
						mappings.push(values.field);
					});
				if ($.inArray(values.code,vars.groups)>-1) $('select#groupfield').append($('<option>').attr('value',values.code).text(values.label));
			});
			vars.fieldinfos=$.fieldparallelize(resp.properties);
			$.each(sorted,function(index){
				if (sorted[index] in vars.fieldinfos)
				{
					var fieldinfo=vars.fieldinfos[sorted[index]];
					/* check required */
					if ('required' in fieldinfo) $('select#requirefield').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
					/* check field type */
					switch (fieldinfo.type)
					{
						case 'CHECK_BOX':
						case 'DROP_DOWN':
						case 'MULTI_SELECT':
						case 'NUMBER':
						case 'RADIO_BUTTON':
						case 'SINGLE_LINE_TEXT':
							switch (fieldinfo.type)
							{
								case 'CHECK_BOX':
								case 'DROP_DOWN':
								case 'MULTI_SELECT':
								case 'RADIO_BUTTON':
									$('select#field').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
									break;
							}
							/* exclude lookup mappings */
							if ($.inArray(fieldinfo.code,mappings)<0) $('select#autofield').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
					}
				}
			});
			/* initialize valiable */
			vars.fieldtable=$('.fields').adjustabletable({
				add:'img.addfield',
				del:'img.delfield',
				addcallback:function(row){
					var index=(vars.fieldtable)?vars.fieldtable.rows.index(row):0;
					vars.fieldparams.push({
						table:null,
						autos:[],
						groups:[],
						requires:[]
					});
					vars.fieldparams[index].table=$('.settings',row).adjustabletable({
						addcallback:function(row){
							vars.fieldparams[index].autos.push(
								$('.autos',row).adjustabletable({
									add:'img.add',
									del:'img.del',
									addcallback:function(row){
										var input=$('input#autovalue',row);
										var inputcontainer=input.closest('.kintoneplugin-input-outer');
										var list=$('select#autovalue',row);
										var listcontainer=list.closest('.kintoneplugin-select-outer');
										var fieldinfo=null;
										var options=[];
										inputcontainer.hide();
										listcontainer.hide();
										$('select#autofield',row).on('change',function(){
											input.val('');
											list.empty();
											inputcontainer.hide();
											listcontainer.hide();
											/* initialize field lists */
											if ($(this).val().length!=0)
											{
												fieldinfo=vars.fieldinfos[$(this).val()];
												if ($.inArray(fieldinfo.type,['NUMBER','SINGLE_LINE_TEXT'])>-1)
												{
													if ($.hasData(input[0]))
														if ($.data(input[0],'initialdata').length!=0)
														{
															input.val($.data(input[0],'initialdata'));
															$.data(input[0],'initialdata','');
														}
													inputcontainer.show();
												}
												else
												{
													options=[fieldinfo.options.length];
													$.each(fieldinfo.options,function(key,values){
														options[values.index]=values.label;
													});
													for (var i=0;i<options.length;i++) list.append($('<option>').attr('value',options[i]).text(options[i]));
													if ($.hasData(list[0]))
														if ($.data(list[0],'initialdata').length!=0)
														{
															list.val($.data(list[0],'initialdata'));
															$.data(list[0],'initialdata','');
														}
													listcontainer.show();
												}
											}
										})
									}
								})
							);
							vars.fieldparams[index].groups.push(
								$('.groups',row).adjustabletable({
									add:'img.add',
									del:'img.del'
								})
							);
							vars.fieldparams[index].requires.push(
								$('.requires',row).adjustabletable({
									add:'img.add',
									del:'img.del'
								})
							);
						}
					});
					$('select#field',row).on('change',function(){
						functions.reloadsettings(vars.fieldparams[index]);
					});
				},
				delcallback:function(index){
					vars.fieldparams.splice(index,1);
				}
			});
			var add=false;
			var row=null;
			var autos=[];
			var groups=[];
			var fields=[];
			var requires=[];
			var settings={};
			var params={};
			if (Object.keys(config).length!==0)
			{
				fields=JSON.parse(config['fields']);
				for (var i=0;i<fields.length;i++)
				{
					if (add) vars.fieldtable.addrow();
					else add=true;
					settings=fields[i]['setting'];
					params=vars.fieldparams[i];
					$('select#field',vars.fieldtable.rows.last()).val(fields[i]['field']);
					functions.reloadsettings(params,function(){
						for (var i2=0;i2<params.table.rows.length;i2++)
						{
							row=params.table.rows.eq(i2);
							if ($('#item',row).val() in settings)
							{
								autos=settings[$('#item',row).val()].autos;
								groups=settings[$('#item',row).val()].groups;
								requires=settings[$('#item',row).val()].requires;
								add=false;
								for (var i3=0;i3<autos.length;i3++)
								{
									if (add) params.autos[i2].addrow();
									else add=true;
									$('select#autofield',params.autos[i2].rows.last()).val(autos[i3].field);
									/* trigger events */
									$.data($('input#autovalue',params.autos[i2].rows.last())[0],'initialdata',autos[i3].value);
									$.data($('select#autovalue',params.autos[i2].rows.last())[0],'initialdata',autos[i3].value);
									$('select#autofield',params.autos[i2].rows.last()).trigger('change');
								}
								add=false;
								for (var i3=0;i3<groups.length;i3++)
								{
									if (add) params.groups[i2].addrow();
									else add=true;
									$('select#groupfield',params.groups[i2].rows.last()).val(groups[i3]);
								}
								add=false;
								for (var i3=0;i3<requires.length;i3++)
								{
									if (add) params.requires[i2].addrow();
									else add=true;
									$('select#requirefield',params.requires[i2].rows.last()).val(requires[i3]);
								}
							}
						}
						add=true;
					});
				}
			}
			else vars.fieldparams[0].table.container.hide();
		},function(error){});
	},function(error){});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var fieldinfo=null;
		var row=null;
		var config=[];
		var autos=[];
		var groups=[];
		var fields=[];
		var requires=[];
		var params={};
		/* check values */
		for (var i=0;i<vars.fieldtable.rows.length;i++)
		{
			var field={field:'',setting:{}};
			row=vars.fieldtable.rows.eq(i);
			params=vars.fieldparams[i];
			if ($('select#field',row).val()=='') continue;
			else field.field=$('select#field',row).val();
			for (var i2=0;i2<params.table.rows.length;i2++)
			{
				autos=[];
				groups=[];
				requires=[];
				for (var i3=0;i3<params.autos[i2].rows.length;i3++)
				{
					row=params.autos[i2].rows.eq(i3);
					if ($('select#autofield',row).val().length==0) continue;
					fieldinfo=vars.fieldinfos[$('select#autofield',row).val()];
					switch (fieldinfo.type)
					{
						case 'NUMBER':
						case 'SINGLE_LINE_TEXT':
							autos.push({
								field:$('select#autofield',row).val(),
								value:$('input#autovalue',row).val()
							});
							break;
						default:
							autos.push({
								field:$('select#autofield',row).val(),
								value:$('select#autovalue',row).val()
							});
							break;
					}
				}
				for (var i3=0;i3<params.groups[i2].rows.length;i3++)
				{
					row=params.groups[i2].rows.eq(i3);
					if ($('select#groupfield',row).val().length==0) continue;
					groups.push($('select#groupfield',row).val());
				}
				for (var i3=0;i3<params.requires[i2].rows.length;i3++)
				{
					row=params.requires[i2].rows.eq(i3);
					if ($('select#requirefield',row).val().length==0) continue;
					requires.push($('select#requirefield',row).val());
				}
				field.setting[$('input#item',params.table.rows.eq(i2)).val()]={
					autos:autos,
					groups:groups,
					requires:requires
				};
			}
			fields.push(field);
		}
		/* setup config */
		config['fields']=JSON.stringify(fields,'');
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);