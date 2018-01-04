/*
*--------------------------------------------------------------------
* jQuery-Plugin "userlinked -config.js-"
* Version: 3.0
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
		autotable:[],
		requiretable:[],
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
		reloadsettings:function(callback){
			var setupsettings=function(records){
				for (var i=0;i<records.length;i++)
				{
					vars.settingtable.addrow();
					vars.settingtable.rows.last().find('#target').val(records[i].code);
					vars.settingtable.rows.last().find('#targetname').text(records[i].name);
				}
				if (callback) callback();
			};
			/* clear rows */
			vars.autotable=[],
			vars.requiretable=[]
			vars.settingtable.clearrows();
			switch ($('select#segment').val())
			{
				case '1':
					$.loadusers(function(records){
						records.sort(function(a,b){
							if(parseInt(a.id)<parseInt(b.id)) return -1;
							if(parseInt(a.id)>parseInt(b.id)) return 1;
							return 0;
						});
						setupsettings(records);
					});
					break;
				case '2':
					$.loadorganizations(function(records){
						records.sort(function(a,b){
							if(parseInt(a.id)<parseInt(b.id)) return -1;
							if(parseInt(a.id)>parseInt(b.id)) return 1;
							return 0;
						});
						setupsettings(records);
					});
					break;
				case '3':
					$.loadgroups(function(records){
						records.sort(function(a,b){
							if(parseInt(a.id)<parseInt(b.id)) return -1;
							if(parseInt(a.id)>parseInt(b.id)) return 1;
							return 0;
						});
						setupsettings(records);
					});
					break;
			}
		}
	};
	/*---------------------------------------------------------------
	 initialize fields
	---------------------------------------------------------------*/
	kintone.api(kintone.api.url('/k/v1/app/views',true),'GET',{app:kintone.app.getId()},function(resp){
		var views=[];
		$.each(resp.views,function(key,values){views.push(values);})
		views.sort(function(a,b){
			if(parseInt(a.index)<parseInt(b.index)) return -1;
			if(parseInt(a.index)>parseInt(b.index)) return 1;
			return 0;
		});
		for (var i=0;i<views.length;i++) $('select#view').append($('<option>').attr('value',views[i].id).text(views[i].name));
		/* get layout */
		kintone.api(kintone.api.url('/k/v1/app/form/layout',true),'GET',{app:kintone.app.getId()},function(resp){
			var sorted=functions.fieldsort(resp.layout);
			/* get fieldinfo */
			kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
				var config=kintone.plugin.app.getConfig(PLUGIN_ID);
				var mappings=[];
				/* append lookup mappings fields */
				$.each(resp.properties,function(key,values){
					if (values.lookup)
						$.each(values.lookup.fieldMappings,function(index,values){
							mappings.push(values.field);
						});
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
							case 'GROUP_SELECT':
							case 'MULTI_SELECT':
							case 'ORGANIZATION_SELECT':
							case 'RADIO_BUTTON':
							case 'SINGLE_LINE_TEXT':
							case 'USER_SELECT':
								/* exclude lookup */
								if (!fieldinfo.lookup)
									if ($.inArray(fieldinfo.code,mappings)<0) $('select#autofield').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
						}
					}
				});
				/* initialize valiable */
				vars.settingtable=$('.settings').adjustabletable({
					addcallback:function(row){
						vars.autotable.push(
							$('.autos',row).adjustabletable({
								add:'img.add',
								del:'img.del',
								addcallback:function(row){
									var list=$('select#autovalue',row);
									var listcontainer=list.closest('.kintoneplugin-select-outer');
									var fieldinfo=null;
									var options=[];
									listcontainer.hide();
									$('select#autofield',row).on('change',function(){
										list.empty();
										/* initialize field lists */
										if ($(this).val().length!=0)
										{
											fieldinfo=vars.fieldinfos[$(this).val()];
											if ($.inArray(fieldinfo.type,['CHECK_BOX','DROP_DOWN','MULTI_SELECT','RADIO_BUTTON'])>-1)
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
											else
											{
												list.html('<option value=""></option>');
												listcontainer.hide();
											}
										}
										else
										{
											list.html('<option value=""></option>');
											listcontainer.hide();
										}
									})
								}
							})
						);
						vars.requiretable.push(
							$('.requires',row).adjustabletable({
								add:'img.add',
								del:'img.del'
							})
						);
					}
				});
				var add=false;
				var row=null;
				var autos=[];
				var requires=[];
				var settings={};
				if (Object.keys(config).length!==0) $('select#segment').val(config['segment']);
				functions.reloadsettings(function(){
					if (Object.keys(config).length!==0)
					{
						settings=JSON.parse(config['setting']);
						for (var i=0;i<vars.settingtable.rows.length;i++)
						{
							row=vars.settingtable.rows.eq(i);
							if ($('#target',row).val() in settings)
							{
								$('select#view',row).val(settings[$('#target',row).val()].view);
								autos=settings[$('#target',row).val()].autos;
								requires=settings[$('#target',row).val()].requires;
								add=false;
								for (var i2=0;i2<autos.length;i2++)
								{
									if (add) vars.autotable[i].addrow();
									else add=true;
									$('select#autofield',vars.autotable[i].rows.last()).val(autos[i2].field);
									/* trigger events */
									$.data($('select#autovalue',vars.autotable[i].rows.last())[0],'initialdata',autos[i2].value);
									$('select#autofield',vars.autotable[i].rows.last()).trigger('change');
								}
								add=false;
								for (var i2=0;i2<requires.length;i2++)
								{
									if (add) vars.requiretable[i].addrow();
									else add=true;
									$('select#requirefield',vars.requiretable[i].rows.last()).val(requires[i2]);
								}
							}
						}
					}
				});
				$('select#segment').on('change',function(){functions.reloadsettings()});
			},function(error){});
		},function(error){});
	});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var error=false;
		var fieldinfo=null;
		var row=null;
		var config=[];
		var autos=[];
		var requires=[];
		var settings={};
		/* check values */
		for (var i=0;i<vars.settingtable.rows.length;i++)
		{
			autos=[];
			requires=[];
			for (var i2=0;i2<vars.autotable[i].rows.length;i2++)
			{
				row=vars.autotable[i].rows.eq(i2);
				if ($('select#autofield',row).val().length==0) continue;
				fieldinfo=vars.fieldinfos[$('select#autofield',row).val()];
				switch (fieldinfo.type)
				{
					case 'GROUP_SELECT':
						if ($('select#segment').val()!='3')
						{
							swal('Error!','設定対象を'+$('select#segment option:selected').text()+'に設定した場合は、グループ選択を自動入力フィールドに設定出来ません。','error');
							error=true;
							return;
						}
						break;
					case 'ORGANIZATION_SELECT':
						if ($('select#segment').val()!='2')
						{
							swal('Error!','設定対象を'+$('select#segment option:selected').text()+'に設定した場合は、組織選択を自動入力フィールドに設定出来ません。','error');
							error=true;
							return;
						}
						break;
					case 'USER_SELECT':
						if ($('select#segment').val()!='1')
						{
							swal('Error!','設定対象を'+$('select#segment option:selected').text()+'に設定した場合は、ユーザー選択を自動入力フィールドに設定出来ません。','error');
							error=true;
							return;
						}
						break;
				}
				autos.push({
					field:$('select#autofield',row).val(),
					value:$('select#autovalue',row).val()
				});
			}
			if (error) return;
			for (var i2=0;i2<vars.requiretable[i].rows.length;i2++)
			{
				row=vars.requiretable[i].rows.eq(i2);
				if ($('select#requirefield',row).val().length==0) continue;
				requires.push($('select#requirefield',row).val());
			}
			row=vars.settingtable.rows.eq(i);
			settings[$('#target',row).val()]={
				autos:autos,
				requires:requires,
				view:$('#view',row).val()
			};
		}
		/* setup config */
		config['segment']=$('select#segment').val();
		config['setting']=JSON.stringify(settings);
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);