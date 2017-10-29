/*
*--------------------------------------------------------------------
* jQuery-Plugin "requiredlinked -config.js-"
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
		relationtable:null,
		fieldtable:[]
	};
	/*---------------------------------------------------------------
	 initialize fields
	---------------------------------------------------------------*/
	kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
		var config=kintone.plugin.app.getConfig(PLUGIN_ID);
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
					$('select#trigger').append($('<option>').attr('value',values.code).text(values.label));
					break;
			}
		});
		/* initialize valiable */
		vars.relationtable=$('.relations').adjustabletable({
			add:'img.addouter',
			del:'img.delouter',
			addcallback:function(row){
				vars.fieldtable.push(
					$('.fields',row).adjustabletable({
						add:'img.addinner',
						del:'img.delinner'
					})
				);
			}
		});
		var addouter=false;
		var addinner=false;
		var row=null;
		var relations=[];
		var fields=[];
		if (Object.keys(config).length!==0)
		{
			relations=JSON.parse(config['relation']);
			$.each(relations,function(key,values){
				if (addouter) vars.relationtable.addrow();
				else addouter=true;
				row=vars.relationtable.rows.last();
				fields=values.split(',');
				$('select#trigger',row).val(key);
				addinner=false;
				for (var i=0;i<fields.length;i++)
				{
					if (addinner) vars.fieldtable[i].addrow();
					else addinner=true;
					$('select#field',vars.fieldtable[i].rows.last()).val(fields[i]);
				}
			});
		}
	},function(error){});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var error=false;
		var row=null;
		var config=[];
		var fields=[];
		var relations={};
		/* check values */
		for (var i=0;i<vars.relationtable.rows.length;i++)
			if ($('select#trigger',vars.relationtable.rows.eq(i)).val()!=0)
			{
				fields=[];
				for (var i2=0;i2<vars.fieldtable[i].rows.length;i2++)
				{
					row=vars.fieldtable[i].rows.eq(i2);
					if ($('select#field',row).val().length==0) continue;
					fields.push($('select#field',row).val());
				}
				relations[$('select#trigger',vars.relationtable.rows.eq(i)).val()]=fields.join(',');
			}
		/* setup config */
		config['relation']=JSON.stringify(relations);
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);