/*
*--------------------------------------------------------------------
* jQuery-Plugin "datecalc -config.js-"
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
						case 'CALC':
							switch (fieldinfo.format.toUpperCase())
							{
								case 'NUMBER':
								case 'NUMBER_DIGIT':
									if (!fieldinfo.lookup)
									{
										$('select#yearfield').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
										$('select#monthfield').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
										$('select#dayfield').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
									}
									break;
							}
							break;
						case 'DATE':
							$('select#fromdate').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							$('select#todate').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
						case 'NUMBER':
							if (!fieldinfo.lookup)
							{
								$('select#yearfield').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#monthfield').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#dayfield').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							}
					}
				}
			});
			/* initialize valiable */
			vars.calculationtable=$('.calculations').adjustabletable({
				add:'img.add',
				del:'img.del',
				addcallback:function(row){
					$('input#year',row).val('0');
					$('input#month',row).val('0');
					$('input#day',row).val('0');
				}
			});
			var add=false;
			var row=null;
			var calculations=[];
			if (Object.keys(config).length!==0)
			{
				calculations=JSON.parse(config['calculation']);
				$.each(calculations,function(index){
					if (add) vars.calculationtable.addrow();
					else add=true;
					row=vars.calculationtable.rows.last();
					$('select#fromdate',row).val(calculations[index].fromdate);
					$('select#todate',row).val(calculations[index].todate);
					$('select#yearfield',row).val(calculations[index].yearfield);
					$('select#monthfield',row).val(calculations[index].monthfield);
					$('select#dayfield',row).val(calculations[index].dayfield);
					$('input#year',row).val(calculations[index].year);
					$('input#month',row).val(calculations[index].month);
					$('input#day',row).val(calculations[index].day);
				});
			}
			else
			{
				$('input#year').val('0');
				$('input#month').val('0');
				$('input#day').val('0');
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
			if ($('select#fromdate',row).val().length==0) continue;
			if ($('select#todate',row).val().length==0) continue;
			if ($('input#year',row).val().length==0) $('input#year',row).val('0');
			if ($('input#month',row).val().length==0) $('input#month',row).val('0');
			if ($('input#day',row).val().length==0) $('input#day',row).val('0');
			if (vars.fieldinfos[$('select#fromdate',row).val()].tablecode!=vars.fieldinfos[$('select#todate',row).val()].tablecode)
			{
				swal('Error!','テーブル内フィールドの指定は同一テーブルにして下さい。','error');
				return;
			}
			if ($('select#yearfield',row).val().length!=0)
				if (vars.fieldinfos[$('select#fromdate',row).val()].tablecode!=vars.fieldinfos[$('select#yearfield',row).val()].tablecode)
				{
					swal('Error!','テーブル内フィールドの指定は同一テーブルにして下さい。','error');
					return;
				}
			if ($('select#monthfield',row).val().length!=0)
				if (vars.fieldinfos[$('select#fromdate',row).val()].tablecode!=vars.fieldinfos[$('select#monthfield',row).val()].tablecode)
				{
					swal('Error!','テーブル内フィールドの指定は同一テーブルにして下さい。','error');
					return;
				}
			if ($('select#dayfield',row).val().length!=0)
				if (vars.fieldinfos[$('select#fromdate',row).val()].tablecode!=vars.fieldinfos[$('select#dayfield',row).val()].tablecode)
				{
					swal('Error!','テーブル内フィールドの指定は同一テーブルにして下さい。','error');
					return;
				}
			if (!$.isNumeric($('input#year',row).val()))
			{
				swal('Error!','年数は数値を入力して下さい。','error');
				return;
			}
			if (!$.isNumeric($('input#month',row).val()))
			{
				swal('Error!','月数は数値を入力して下さい。','error');
				return;
			}
			if (!$.isNumeric($('input#day',row).val()))
				if ($('input#day',row).val()!='初' && $('input#day',row).val()!='末')
				{
					swal('Error!','日数は数値を入力して下さい。','error');
					return;
				}
			calculations.push({
				fromdate:$('select#fromdate',row).val(),
				todate:$('select#todate',row).val(),
				year:$('input#year',row).val(),
				yearfield:$('select#yearfield',row).val(),
				month:$('input#month',row).val(),
				monthfield:$('select#monthfield',row).val(),
				day:$('input#day',row).val(),
				dayfield:$('select#dayfield',row).val(),
				tablecode:vars.fieldinfos[$('select#fromdate',row).val()].tablecode
			});
		}
		/* setup config */
		config['calculation']=JSON.stringify(calculations);
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);