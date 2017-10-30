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
		relationtable:null
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
					$('select#require').append($('<option>').attr('value',values.code).text(values.label));
					$('select#trigger').append($('<option>').attr('value',values.code).text(values.label));
					break;
			}
		});
		/* initialize valiable */
		vars.relationtable=$('.relations').adjustabletable({
			add:'img.add',
			del:'img.del'
		});
		var add=false;
		var row=null;
		var relations=[];
		if (Object.keys(config).length!==0)
		{
			relations=JSON.parse(config['relation']);
			$.each(relations,function(index){
				if (add) vars.relationtable.addrow();
				else add=true;
				row=vars.relationtable.rows.last();
				$('select#trigger',row).val(relations[index].trigger);
				$('select#require',row).val(relations[index].require);
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
		var relations=[];
		/* check values */
		for (var i=0;i<vars.relationtable.rows.length;i++)
		{
			row=vars.relationtable.rows.eq(i);
			if ($('select#trigger',row).val().length==0) continue;
			if ($('select#require',row).val().length==0) continue;
			relations.push({
				trigger:$('select#trigger',row).val(),
				require:$('select#require',row).val()
			});
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