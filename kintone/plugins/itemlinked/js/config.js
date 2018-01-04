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
		itemtable:null,
		groups:[],
		autotable:[],
		grouptable:[],
		requiretable:[],
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
		reloaditems:function(callback){
			/* clear rows */
			vars.autotable=[];
			vars.grouptable=[];
			vars.requiretable=[];
			vars.itemtable.clearrows();
			if ($('select#trigger').val().length!=0)
			{
				var fieldinfo=vars.fieldinfos[$('select#trigger').val()];
				var options=[fieldinfo.options.length];
				$.each(fieldinfo.options,function(key,values){
					options[values.index]=values.label;
				});
				for (var i=0;i<options.length;i++)
				{
					vars.itemtable.addrow();
					vars.itemtable.rows.last().find('input#item').val(options[i]);
					vars.itemtable.rows.last().find('span.itemname').text(options[i]);
				}
				vars.itemtable.container.show();
				if (callback) callback();
			}
			else vars.itemtable.container.hide();
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
							if ($.inArray(fieldinfo.type,['DROP_DOWN','RADIO_BUTTON'])>-1) $('select#trigger').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							/* exclude lookup mappings */
							if ($.inArray(fieldinfo.code,mappings)<0) $('select#autofield').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
					}
				}
			});
			/* initialize valiable */
			vars.itemtable=$('.items').adjustabletable({
				addcallback:function(row){
					vars.autotable.push(
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
					vars.grouptable.push(
						$('.groups',row).adjustabletable({
							add:'img.add',
							del:'img.del'
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
			var groups=[];
			var requires=[];
			var items={};
			if (Object.keys(config).length!==0)
			{
				items=JSON.parse(config['item']);
				$('select#trigger').val(config['trigger']);
				functions.reloaditems(function(){
					for (var i=0;i<vars.itemtable.rows.length;i++)
					{
						row=vars.itemtable.rows.eq(i);
						if ($('#item',row).val() in items)
						{
							autos=items[$('#item',row).val()].autos;
							groups=items[$('#item',row).val()].groups;
							requires=items[$('#item',row).val()].requires;
							add=false;
							for (var i2=0;i2<autos.length;i2++)
							{
								if (add) vars.autotable[i].addrow();
								else add=true;
								$('select#autofield',vars.autotable[i].rows.last()).val(autos[i2].field);
								/* trigger events */
								$.data($('input#autovalue',vars.autotable[i].rows.last())[0],'initialdata',autos[i2].value);
								$.data($('select#autovalue',vars.autotable[i].rows.last())[0],'initialdata',autos[i2].value);
								$('select#autofield',vars.autotable[i].rows.last()).trigger('change');
							}
							add=false;
							for (var i2=0;i2<groups.length;i2++)
							{
								if (add) vars.grouptable[i].addrow();
								else add=true;
								$('select#groupfield',vars.grouptable[i].rows.last()).val(groups[i2]);
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
				});
			}
			else vars.itemtable.container.hide();
			$('select#trigger').on('change',function(){functions.reloaditems()});
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
		var requires=[];
		var items={};
		/* check values */
		for (var i=0;i<vars.itemtable.rows.length;i++)
		{
			autos=[];
			groups=[];
			requires=[];
			for (var i2=0;i2<vars.autotable[i].rows.length;i2++)
			{
				row=vars.autotable[i].rows.eq(i2);
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
			for (var i2=0;i2<vars.grouptable[i].rows.length;i2++)
			{
				row=vars.grouptable[i].rows.eq(i2);
				if ($('select#groupfield',row).val().length==0) continue;
				groups.push($('select#groupfield',row).val());
			}
			for (var i2=0;i2<vars.requiretable[i].rows.length;i2++)
			{
				row=vars.requiretable[i].rows.eq(i2);
				if ($('select#requirefield',row).val().length==0) continue;
				requires.push($('select#requirefield',row).val());
			}
			items[$('input#item',vars.itemtable.rows.eq(i)).val()]={
				autos:autos,
				groups:groups,
				requires:requires
			};
		}
		/* setup config */
		config['trigger']=$('select#trigger').val();
		config['item']=JSON.stringify(items);
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);