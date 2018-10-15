/*
*--------------------------------------------------------------------
* jQuery-Plugin "gmail -config.js-"
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
		offset:0,
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
							if (fieldinfo.tablecode)
							{
								$('select#transfer_fromdate').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#transfer_todate').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							}
							break;
						case 'MULTI_LINE_TEXT':
							if (fieldinfo.tablecode) $('select#transfer_profile').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							else $('select#zapiermail').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
						case 'SINGLE_LINE_TEXT':
							if (fieldinfo.tablecode)
							{
								$('select#transfer_id').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#transfer_io').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#transfer_item').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#transfer_client').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#transfer_price').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#transfer_number').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#transfer_promotion').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							}
							break;
					}
				}
			});
			/* initialize valiable */
			$.loadgroups(function(records){
				for (var i=0;i<records.length;i++) $('select#permitgroup').append($('<option>').attr('value',records[i].code).text(records[i].name));
				/* setup config */
				if (Object.keys(config).length!==0)
				{
					$('select#zapiermail').val(config['zapiermail']);
					$('select#transfer_id').val(config['transfer_id']);
					$('select#transfer_io').val(config['transfer_io']);
					$('select#transfer_item').val(config['transfer_item']);
					$('select#transfer_client').val(config['transfer_client']);
					$('select#transfer_price').val(config['transfer_price']);
					$('select#transfer_number').val(config['transfer_number']);
					$('select#transfer_fromdate').val(config['transfer_fromdate']);
					$('select#transfer_todate').val(config['transfer_todate']);
					$('select#transfer_profile').val(config['transfer_profile']);
					$('select#transfer_promotion').val(config['transfer_promotion']);
					$('select#permitgroup').val(config['permitgroup']);
					$('input#client_id').val(config['client_id']);
				}
			});
		},function(error){});
	},function(error){});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var config=[];
		/* check values */
		if ($('select#zapiermail').val()=='')
		{
			swal('Error!','枠確保メールフィールドを選択して下さい。','error');
			return;
		}
		if ($('select#transfer_id').val()=='')
		{
			swal('Error!','ID番号転記フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#transfer_io').val()=='')
		{
			swal('Error!','IO番号転記フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#transfer_item').val()=='')
		{
			swal('Error!','商品転記フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#transfer_client').val()=='')
		{
			swal('Error!','クライアント転記フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#transfer_price').val()=='')
		{
			swal('Error!','価格転記フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#transfer_number').val()=='')
		{
			swal('Error!','掲載数転記フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#transfer_fromdate').val()=='')
		{
			swal('Error!','掲載開始日転記フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#transfer_todate').val()=='')
		{
			swal('Error!','掲載終了日転記フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#transfer_profile').val()=='')
		{
			swal('Error!','プロファイル詳細転記フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#transfer_promotion').val()=='')
		{
			swal('Error!','プロモーション転記フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#permitgroup').val()=='')
		{
			swal('Error!','プラグイン使用許可グループを選択して下さい。','error');
			return;
		}
		if ($('input#client_id').val()=='')
		{
			swal('Error!','Google OAuth クライアントIDを入力して下さい。','error');
			return;
		}
		if (vars.fieldinfos[$('select#transfer_id').val()].tablecode!=vars.fieldinfos[$('select#transfer_io').val()].tablecode)
		{
			swal('Error!','転記フィールドの指定は同一テーブルにして下さい。','error');
			return;
		}
		if (vars.fieldinfos[$('select#transfer_id').val()].tablecode!=vars.fieldinfos[$('select#transfer_item').val()].tablecode)
		{
			swal('Error!','転記フィールドの指定は同一テーブルにして下さい。','error');
			return;
		}
		if (vars.fieldinfos[$('select#transfer_id').val()].tablecode!=vars.fieldinfos[$('select#transfer_client').val()].tablecode)
		{
			swal('Error!','転記フィールドの指定は同一テーブルにして下さい。','error');
			return;
		}
		if (vars.fieldinfos[$('select#transfer_id').val()].tablecode!=vars.fieldinfos[$('select#transfer_price').val()].tablecode)
		{
			swal('Error!','転記フィールドの指定は同一テーブルにして下さい。','error');
			return;
		}
		if (vars.fieldinfos[$('select#transfer_id').val()].tablecode!=vars.fieldinfos[$('select#transfer_number').val()].tablecode)
		{
			swal('Error!','転記フィールドの指定は同一テーブルにして下さい。','error');
			return;
		}
		if (vars.fieldinfos[$('select#transfer_id').val()].tablecode!=vars.fieldinfos[$('select#transfer_fromdate').val()].tablecode)
		{
			swal('Error!','転記フィールドの指定は同一テーブルにして下さい。','error');
			return;
		}
		if (vars.fieldinfos[$('select#transfer_id').val()].tablecode!=vars.fieldinfos[$('select#transfer_todate').val()].tablecode)
		{
			swal('Error!','転記フィールドの指定は同一テーブルにして下さい。','error');
			return;
		}
		if (vars.fieldinfos[$('select#transfer_id').val()].tablecode!=vars.fieldinfos[$('select#transfer_profile').val()].tablecode)
		{
			swal('Error!','転記フィールドの指定は同一テーブルにして下さい。','error');
			return;
		}
		if (vars.fieldinfos[$('select#transfer_id').val()].tablecode!=vars.fieldinfos[$('select#transfer_promotion').val()].tablecode)
		{
			swal('Error!','転記フィールドの指定は同一テーブルにして下さい。','error');
			return;
		}
		/* setup config */
		config['zapiermail']=$('select#zapiermail').val();
		config['transfer_id']=$('select#transfer_id').val();
		config['transfer_io']=$('select#transfer_io').val();
		config['transfer_item']=$('select#transfer_item').val();
		config['transfer_client']=$('select#transfer_client').val();
		config['transfer_price']=$('select#transfer_price').val();
		config['transfer_number']=$('select#transfer_number').val();
		config['transfer_fromdate']=$('select#transfer_fromdate').val();
		config['transfer_todate']=$('select#transfer_todate').val();
		config['transfer_profile']=$('select#transfer_profile').val();
		config['transfer_promotion']=$('select#transfer_promotion').val();
		config['permitgroup']=$('select#permitgroup').val();
		config['client_id']=$('input#client_id').val();
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);