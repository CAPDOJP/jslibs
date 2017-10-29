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
		fields:null,
		itemtable:null,
		fieldtable:[]
	};
	var functions={
		reloaditems:function(callback){
			/* clear rows */
			vars.fieldtable=[];
			vars.itemtable.clearrows();
			if ($('select#trigger').val().length!=0)
			{
				var fields=vars.fields[$('select#trigger').val()];
				var options=[fields.options.length];
				$.each(fields.options,function(key,values){
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
	kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
		var config=kintone.plugin.app.getConfig(PLUGIN_ID);
		vars.fields=resp.properties;
		$.each(resp.properties,function(key,values){
			/* check field type */
			switch (values.type)
			{
				case 'CALC':
				case 'CATEGORY':
				case 'CREATED_TIME':
				case 'CREATOR':
				case 'GROUP':
				case 'MODIFIER':
				case 'RECORD_NUMBER':
				case 'REFERENCE_TABLE':
				case 'STATUS':
				case 'STATUS_ASSIGNEE':
				case 'SUBTABLE':
				case 'UPDATED_TIME':
					break;
				default:
					$('select#field').append($('<option>').attr('value',values.code).text(values.label));
					switch (values.type)
					{
						case 'DROP_DOWN':
						case 'RADIO_BUTTON':
							$('select#trigger').append($('<option>').attr('value',values.code).text(values.label));
							break;
					}
					break;
			}
		});
		/* initialize valiable */
		vars.itemtable=$('.items').adjustabletable({
			addcallback:function(row){
				vars.fieldtable.push(
					$('.fields',row).adjustabletable({
						add:'img.add',
						del:'img.del'
					})
				);
			}
		});
		var add=false;
		var row=null;
		var items=[];
		var fields=[];
		if (Object.keys(config).length!==0)
		{
			items=JSON.parse(config['item']);
			$('select#trigger').val(config['trigger']);
			functions.reloaditems(function(){
				for (var i=0;i<vars.itemtable.rows.length;i++)
				{
					row=vars.itemtable.rows.eq(i);
					if ($('input#item',row).val() in items)
					{
						fields=items[$('input#item',row).val()].split(',');
						add=false;
						for (var i2=0;i2<fields.length;i2++)
						{
							if (add) vars.fieldtable[i].addrow();
							else add=true;
							$('select#field',vars.fieldtable[i].rows.last()).val(fields[i2]);
						}
					}
				}
			});
		}
		else vars.itemtable.container.hide();
		$('select#trigger').on('change',function(){functions.reloaditems()});
	},function(error){});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var error=false;
		var row=null;
		var config=[];
		var fields=[];
		var items={};
		/* check values */
		for (var i=0;i<vars.itemtable.rows.length;i++)
		{
			fields=[];
			for (var i2=0;i2<vars.fieldtable[i].rows.length;i2++)
			{
				row=vars.fieldtable[i].rows.eq(i2);
				if ($('select#field',row).val().length==0) continue;
				fields.push($('select#field',row).val());
			}
			items[$('input#item',vars.itemtable.rows.eq(i)).val()]=fields.join(',');
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