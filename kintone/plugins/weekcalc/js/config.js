/*
*--------------------------------------------------------------------
* jQuery-Plugin "weekcalc -config.js-"
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
		},
		reloadweekoption:function(row,callback){
			/* clear rows */
			var target=$('select#week',row);
			if (target.val())
			{
				var fieldinfo=vars.fieldinfos[target.val()];
				var options=[];
				if (fieldinfo.type!='SINGLE_LINE_TEXT')
				{
					options=[fieldinfo.options.length];
					$.each(fieldinfo.options,function(key,values){
						options[values.index]=values.label;
					});
					for (var i=0;i<7;i++)
					{
						$('select#weekoption'+i.toString(),row).empty();
						for (var i2=0;i2<options.length;i2++) $('select#weekoption'+i.toString(),row).append($('<option>').attr('value',options[i2]).text(options[i2]));
					}
					$('.week',row).show();
				}
				else $('.week',row).hide();
			}
			else $('.week',row).hide();
			if (callback) callback();
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
						case 'DROP_DOWN':
						case 'RADIO_BUTTON':
							$('select#week').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
						case 'SINGLE_LINE_TEXT':
							$('select#week').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
					}
				}
			});
			/* initialize valiable */
			vars.calculationtable=$('.calculations').adjustabletable({
				add:'img.add',
				del:'img.del',
				addcallback:function(row){
					$('.week',row).hide();
					$('select#week',row).on('change',function(){functions.reloadweekoption(row);});
				}
			});
			var add=false;
			var row=null;
			var calculations=[];
			if (Object.keys(config).length!==0)
			{
				calculations=JSON.parse(config['calculation']);
				if (config['bulk']=='1') $('input#bulk').prop('checked',true);
				$.each(calculations,function(index){
					if (add) vars.calculationtable.addrow();
					else add=true;
					row=vars.calculationtable.rows.last();
					$('select#date',row).val(calculations[index].date);
					$('select#week',row).val(calculations[index].week);
					if (vars.fieldinfos[calculations[index].week].type!='SINGLE_LINE_TEXT')
					{
						functions.reloadweekoption(row,function(){
							for (var i=0;i<7;i++) $('select#weekoption'+i.toString(),row).val(calculations[index].weekoption[i]);
							$('.week',row).show();
						});
					}
					else $('.week',row).hide();
				});
			}
			else  $('.week',row).hide();
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
		var weekoption=[];
		var week=[
			'日曜日',
			'月曜日',
			'火曜日',
			'水曜日',
			'木曜日',
			'金曜日',
			'土曜日'
		];
		/* check values */
		for (var i=0;i<vars.calculationtable.rows.length;i++)
		{
			row=vars.calculationtable.rows.eq(i);
			weekoption=[];
			if (!$('select#date',row).val()) continue;
			if (!$('select#week',row).val()) continue;
			if (vars.fieldinfos[$('select#date',row).val()].tablecode!=vars.fieldinfos[$('select#week',row).val()].tablecode)
			{
				swal('Error!','テーブル内フィールドの指定は同一テーブルにして下さい。','error');
				return;
			}
			if (vars.fieldinfos[$('select#week',row).val()].type!='SINGLE_LINE_TEXT')
			{
				var type=(vars.fieldinfos[$('select#week',row).val()].type=='DROP_DOWN')?'ドロップダウン':'ラジオボタン';
				for (var i2=0;i2<7;i2++)
				{
					if (!$('select#weekoption'+i2.toString(),row).val())
					{
						swal('Error!',type+'フィールドで設定された'+week[i2]+'に該当する項目を指定して下さい。','error');
						return;
					}
					weekoption.push($('select#weekoption'+i2.toString(),row).val());
				}
			}
			calculations.push({
				date:$('select#date',row).val(),
				week:$('select#week',row).val(),
				weekoption:weekoption
			});
		}
		/* setup config */
		config['bulk']=($('input#bulk').prop('checked'))?'1':'0';
		config['calculation']=JSON.stringify(calculations);
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);