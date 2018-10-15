/*
*--------------------------------------------------------------------
* jQuery-Plugin "addresscopy -config.js-"
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
		copytable:null
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
				case 'SINGLE_LINE_TEXT':
					$('select#addressfrom').append($('<option>').attr('value',values.code).text(values.label));
					$('select#addressto').append($('<option>').attr('value',values.code).text(values.label));
					$('select#buildingfrom').append($('<option>').attr('value',values.code).text(values.label));
					$('select#buildingto').append($('<option>').attr('value',values.code).text(values.label));
					$('select#zipcodefrom').append($('<option>').attr('value',values.code).text(values.label));
					$('select#zipcodeto').append($('<option>').attr('value',values.code).text(values.label));
					break;
				case 'DROP_DOWN':
				case 'RADIO_BUTTON':
					$('select#conditionfield').append($('<option>').attr('value',values.code).text(values.label));
					break;
			}
		});
		/* initialize valiable */
		$('select#conditionfield').on('change',function(){
			var list=$('select#conditionvalue');
			var options=[];
			/* initialize field lists */
			list.empty();
			if ($(this).val().length!=0)
			{
				options=[vars.fields[$(this).val()].options.length];
				$.each(vars.fields[$(this).val()].options,function(key,values){
					options[values.index]=values.label;
				});
				for (var i=0;i<options.length;i++) list.append($('<option>').attr('value',options[i]).text(options[i]));
				if ($.hasData(list[0]))
					if ($.data(list[0],'initialdata').length!=0)
					{
						list.val($.data(list[0],'initialdata'));
						$.data(list[0],'initialdata','');
					}
			}
		});
		if (Object.keys(config).length!==0)
		{
			$('select#conditionfield').val(config['conditionfield']);
			$('select#addressfrom').val(config['addressfrom']);
			$('select#addressto').val(config['addressto']);
			$('select#buildingfrom').val(config['buildingfrom']);
			$('select#buildingto').val(config['buildingto']);
			$('select#zipcodefrom').val(config['zipcodefrom']);
			$('select#zipcodeto').val(config['zipcodeto']);
			$('input#license').val(config['license']);
			/* trigger events */
			$.data($('select#conditionvalue')[0],'initialdata',config['conditionvalue']);
			$('select#conditionfield').trigger('change');
		}
	},function(error){});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var config=[];
		/* check values */
		if ($('select#conditionfield').val().length==0)
		{
			swal('Error!','コピー条件フィールドを入力して下さい。','error');
			return;
		}
		if ($('select#addressfrom').val().length==0)
		{
			swal('Error!','都道府県/市区郡/町名番地フィールドを入力して下さい。','error');
			return;
		}
		if ($('select#addressto').val().length==0)
		{
			swal('Error!','都道府県/市区郡/町名番地フィールドを入力して下さい。','error');
			return;
		}
		if ($('select#buildingfrom').val().length==0)
		{
			swal('Error!','ビル・建物名フィールドを入力して下さい。','error');
			return;
		}
		if ($('select#buildingto').val().length==0)
		{
			swal('Error!','ビル・建物名フィールドを入力して下さい。','error');
			return;
		}
		if ($('select#zipcodefrom').val().length==0)
		{
			swal('Error!','郵便番号フィールドを入力して下さい。','error');
			return;
		}
		if ($('select#zipcodeto').val().length==0)
		{
			swal('Error!','郵便番号フィールドを入力して下さい。','error');
			return;
		}
		if ($('input#license').val().length==0)
		{
			swal('Error!','ライセンス認証URLを入力して下さい。','error');
			return;
		}
		/* setup config */
		config['conditionfield']=$('select#conditionfield').val();
		config['conditionvalue']=$('select#conditionvalue').val();
		config['addressfrom']=$('select#addressfrom').val();
		config['addressto']=$('select#addressto').val();
		config['buildingfrom']=$('select#buildingfrom').val();
		config['buildingto']=$('select#buildingto').val();
		config['zipcodefrom']=$('select#zipcodefrom').val();
		config['zipcodeto']=$('select#zipcodeto').val();
		config['license']=$('input#license').val();
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);