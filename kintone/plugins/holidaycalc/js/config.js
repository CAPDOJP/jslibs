/*
*--------------------------------------------------------------------
* jQuery-Plugin "holidaycalc -config.js-"
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
		calculationtable:null,
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
			vars.fieldinfos=$.fieldparallelize(resp.properties);
			$.each(sorted,function(index){
				if (sorted[index] in vars.fieldinfos)
				{
					var fieldinfo=vars.fieldinfos[sorted[index]];
					/* check field type */
					switch (fieldinfo.type)
					{
						case 'DATE':
						case 'DATETIME':
							$('select#date').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
						case 'SINGLE_LINE_TEXT':
							$('select#holiday').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
					}
				}
			});
			/* initialize valiable */
			vars.calculationtable=$('.calculations').adjustabletable({
				add:'img.add',
				del:'img.del'
			});
			var add=false;
			var row=null;
			var calculations=[];
			if (Object.keys(config).length!==0)
			{
				calculations=JSON.parse(config['calculation']);
				$('input#apikey').val(config['apikey']);
				if (config['bulk']=='1') $('input#bulk').prop('checked',true);
				$.each(calculations,function(index){
					if (add) vars.calculationtable.addrow();
					else add=true;
					row=vars.calculationtable.rows.last();
					$('select#date',row).val(calculations[index].date);
					$('select#holiday',row).val(calculations[index].holiday);
				});
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
		var calculations=[];
		/* check values */
		for (var i=0;i<vars.calculationtable.rows.length;i++)
		{
			row=vars.calculationtable.rows.eq(i);
			if (!$('select#date',row).val()) continue;
			if (!$('select#holiday',row).val()) continue;
			if (vars.fieldinfos[$('select#date',row).val()].tablecode!=vars.fieldinfos[$('select#holiday',row).val()].tablecode)
			{
				swal('Error!','テーブル内フィールドの指定は同一テーブルにして下さい。','error');
				return;
			}
			calculations.push({
				date:$('select#date',row).val(),
				holiday:$('select#holiday',row).val()
			});
		}
		if ($('input#apikey').val()=='')
		{
			swal('Error!','Google Calendar APIキーを入力して下さい。','error');
			return;
		}
		/* setup config */
		config['bulk']=($('input#bulk').prop('checked'))?'1':'0';
		config['apikey']=$('input#apikey').val();
		config['calculation']=JSON.stringify(calculations);
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);