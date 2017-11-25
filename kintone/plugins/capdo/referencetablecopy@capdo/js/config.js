/*
*--------------------------------------------------------------------
* jQuery-Plugin "referencetablecopy -config.js-"
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
		fields:null,
		layout:null,
		relationtable:null,
		fieldtable:[]
	};
	var functions={
		reloadcopyfrom:function(row,initialize){
			var index=vars.relationtable.rows.index(row);
			if ($('select#copyfrom',row).val().length!=0)
			{
				var fields=vars.fields[$('select#copyfrom',row).val()].referenceTable.displayFields;
				var row=null;
				for (var i=0;i<vars.fieldtable[index].rows.length;i++)
				{
					row=vars.fieldtable[index].rows.eq(i);
					$('select#copyfromcode',row).empty();
					$('select#copyfromcode',row).append($('<option>').attr('value','').text(''));
					for (var i2=0;i2<fields.length;i2++) $('select#copyfromcode',row).append($('<option>').attr('value',fields[i2]).text(fields[i2]));
					if (initialize!=null) $('select#copyfromcode',row).val(initialize[$('input#copytocode',row).val()]);
				}
			}
		},
		reloadcopyto:function(row,initialize){
			var index=vars.relationtable.rows.index(row);
			vars.fieldtable[index].clearrows();
			if ($('select#copyto',row).val().length!=0)
			{
				var fields=vars.fields[$('select#copyto',row).val()].fields;
				for (var i=0;i<vars.layout.length;i++)
				{
					if (vars.layout[i].type!='SUBTABLE') continue;
					if (vars.layout[i].code!=$('select#copyto',row).val()) continue;
					var layout=vars.layout[i].fields;
					for (var i2=0;i2<layout.length;i2++)
					{
						vars.fieldtable[index].addrow();
						vars.fieldtable[index].rows.last().find('input#copytocode').val(fields[layout[i2].code].code);
						vars.fieldtable[index].rows.last().find('span#copytoname').text(fields[layout[i2].code].label);
					}
				}
			}
			else $('select#copyfrom',row).val('');
			functions.reloadcopyfrom(row,initialize);
		}
	};
	/*---------------------------------------------------------------
	 initialize fields
	---------------------------------------------------------------*/
	kintone.api(kintone.api.url('/k/v1/app/form/layout',true),'GET',{app:kintone.app.getId()},function(resp){
		vars.layout=resp.layout;
		kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
			var config=kintone.plugin.app.getConfig(PLUGIN_ID);
			vars.fields=resp.properties;
			$.each(resp.properties,function(key,values){
				/* check field type */
				switch (values.type)
				{
					case 'REFERENCE_TABLE':
						$('select#copyfrom').append($('<option>').attr('value',values.code).text(values.label));
						break;
					case 'SUBTABLE':
						$('select#copyto').append($('<option>').attr('value',values.code).text(values.code));
						break;
				}
			});
			/* initialize valiable */
			vars.relationtable=$('.relations').adjustabletable({
				add:'img.add',
				del:'img.del',
				addcallback:function(row){
					vars.fieldtable.push($('.fields',row).adjustabletable());
					vars.fieldtable[vars.fieldtable.length-1].clearrows();
					$('select#copyfrom',row).on('change',function(){
						functions.reloadcopyfrom(row);
					});
					$('select#copyto',row).on('change',function(){
						functions.reloadcopyto(row);
					});
				}
			});
			var add=false;
			var row=null;
			var relations=[];
			var fields={};
			if (Object.keys(config).length!==0)
			{
				relations=JSON.parse(config['relation']);
				$('input#license').val(config['license']);
				$.each(relations,function(index){
					if (add) vars.relationtable.addrow();
					else add=true;
					row=vars.relationtable.rows.last();
					$('select#copyfrom',row).val(relations[index].copyfrom);
					$('select#copyto',row).val(relations[index].copyto);
					functions.reloadcopyto(row,relations[index].fields);
				});
			}
			else
			{
				row=vars.relationtable.rows.eq(0);
				functions.reloadcopyto(row);
			}
		},function(error){});
	},function(error){});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var error=false;
		var row=null;
		var config=[];
		var fields={};
		var relations=[];
		/* check values */
		for (var i=0;i<vars.relationtable.rows.length;i++)
		{
			fields={};
			if ($('select#copyfrom',row).val().length==0) continue;
			if ($('select#copyto',row).val().length==0) continue;
			for (var i2=0;i2<vars.fieldtable[i].rows.length;i2++)
			{
				row=vars.fieldtable[i].rows.eq(i2);
				fields[$('input#copytocode',row).val()]=$('select#copyfromcode',row).val();
			}
			row=vars.relationtable.rows.eq(i);
			relations.push({
				copyfrom:$('select#copyfrom',row).val(),
				copyto:$('select#copyto',row).val(),
				fields:fields
			});
		}
		if ($('input#license').val().length==0)
		{
			swal('Error!','ライセンス認証URLを入力して下さい。','error');
			return;
		}
		/* setup config */
		config['relation']=JSON.stringify(relations);
		config['license']=$('input#license').val();
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);