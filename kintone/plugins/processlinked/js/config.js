/*
*--------------------------------------------------------------------
* jQuery-Plugin "processlinked -config.js-"
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
		actiontable:null,
		fieldtable:[]
	};
	/*---------------------------------------------------------------
	 initialize fields
	---------------------------------------------------------------*/
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
		$.each(resp.properties,function(key,values){
			/* check field type */
			switch (values.type)
			{
				case 'CALC':
				case 'CATEGORY':
				case 'CREATED_TIME':
				case 'CREATOR':
				case 'FILE':
				case 'GROUP':
				case 'MODIFIER':
				case 'RECORD_NUMBER':
				case 'REFERENCE_TABLE':
				case 'RICH_TEXT':
				case 'STATUS':
				case 'STATUS_ASSIGNEE':
				case 'SUBTABLE':
				case 'UPDATED_TIME':
					break;
				default:
					/* exclude lookup */
					if (!values.lookup)
						if ($.inArray(values.code,mappings)<0) $('select#field').append($('<option>').attr('value',values.code).text(values.label));
					break;
			}
		});
		kintone.api(kintone.api.url('/k/v1/app/status',true),'GET',{app:kintone.app.getId()},function(resp){
			var add=false;
			var row=null;
			var actions=(Object.keys(config).length!==0)?JSON.parse(config['action']):{};
			var actionfields=[];
			vars.actiontable=$('.actions').adjustabletable({
				addcallback:function(row){
					vars.fieldtable.push(
						$('.fields',row).adjustabletable({
							add:'img.add',
							del:'img.del'
						})
					);
				}
			});
			if (resp.actions)
				for (var i=0;i<resp.actions.length;i++)
				{
					if (i!=0) vars.actiontable.addrow();
					row=vars.actiontable.rows.last();
					$('span.actionname',row).text(resp.actions[i].name);
					$('input#action',row).val(resp.actions[i].name);
					if (resp.actions[i].name in actions)
					{
						actionfields=actions[resp.actions[i].name].split(',');
						add=false;
						for (var i2=0;i2<actionfields.length;i2++)
						{
							if (add) vars.fieldtable[i].addrow();
							else add=true;
							$('select#field',vars.fieldtable[i].rows.last()).val(actionfields[i2]);
						}
					}
				}
		},function(error){});
	},function(error){});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var row=null;
		var config=[];
		var fields=[];
		var actions={};
		/* check values */
		for (var i=0;i<vars.actiontable.rows.length;i++)
		{
			fields=[];
			for (var i2=0;i2<vars.fieldtable[i].rows.length;i2++)
			{
				row=vars.fieldtable[i].rows.eq(i2);
				if ($('select#field',row).val().length==0) continue;
				fields.push($('select#field',row).val());
			}
			actions[$('input#action',vars.actiontable.rows.eq(i)).val()]=fields.join(',');
		}
		/* setup config */
		config['action']=JSON.stringify(actions);
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);