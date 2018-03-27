/*
*--------------------------------------------------------------------
* jQuery-Plugin "freeedocs -config.js-"
* Version: 1.0
* Copyright (c) 2018 TIS
*
* Released under the MIT License.
* http://tis2010.jp/license.txt
* -------------------------------------------------------------------
*/
jQuery.noConflict();
(function($,PLUGIN_ID){
	"use strict";
	var vars={
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
			/* initialize valiable */
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
									$('select#partner_prefecture_code').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
									break;
							}
							break;
						case 'DATE':
							if (fieldinfo.tablecode.length==0)
							{
								$('select#issue_date').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#sales_added_date').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#payment_date').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							}
							break;
						case 'DROP_DOWN':
						case 'RADIO_BUTTON':
							if (fieldinfo.tablecode.length!=0) $('select#unit').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
						case 'LINK':
							if (fieldinfo.protocol=='WEB') $('select#doc_url').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
						case 'MULTI_LINE_TEXT':
							if (fieldinfo.tablecode.length==0) $('select#notes').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
						case 'NUMBER':
							if (fieldinfo.tablecode.length==0)
							{
								$('select#doc_reference_id').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#partner_id').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#partner_prefecture_code').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							}
							else
							{
								$('select#unit_price').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#qty').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#account_item_id').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							}
							break;
						case 'SINGLE_LINE_TEXT':
							if (fieldinfo.tablecode.length==0)
							{
								$('select#doc_reference_id').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#doc_status').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#company_info').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#partner_name').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#partner_zipcode').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#partner_address1').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#partner_address2').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#partner_info').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#description').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#bank_info').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							}
							else
							{
								$('select#breakdown').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#unit').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#item_name').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#section_name').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							}
					}
				}
			});
			if (Object.keys(config).length!==0)
			{
				$('input#freeeappid').val(config['freeeappid']);
				$('input#freeesecret').val(config['freeesecret']);
				$('input#license').val(config['license']);
				$('select#taxshift').val(config['taxshift']);
				$('select#doctype').val(config['doctype']);
				$('select#company_info').val(config['company_info']);
				$('select#doc_reference_id').val(config['doc_reference_id']);
				$('select#doc_status').val(config['doc_status']);
				$('select#issue_date').val(config['issue_date']);
				$('select#sales_added_date').val(config['sales_added_date']);
				$('select#payment_date').val(config['payment_date']);
				$('select#partner_id').val(config['partner_id']);
				$('select#partner_name').val(config['partner_name']);
				$('select#partner_zipcode').val(config['partner_zipcode']);
				$('select#partner_prefecture_code').val(config['partner_prefecture_code']);
				$('select#partner_address1').val(config['partner_address1']);
				$('select#partner_address2').val(config['partner_address2']);
				$('select#partner_info').val(config['partner_info']);
				$('select#description').val(config['description']);
				$('select#bank_info').val(config['bank_info']);
				$('select#notes').val(config['notes']);
				$('select#breakdown').val(config['breakdown']);
				$('select#unit_price').val(config['unit_price']);
				$('select#qty').val(config['qty']);
				$('select#unit').val(config['unit']);
				$('select#account_item_id').val(config['account_item_id']);
				$('select#item_name').val(config['item_name']);
				$('select#section_name').val(config['section_name']);
				$('select#doc_url').val(config['doc_url']);
			}
		});
	},function(error){});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var config=[];
		var tablecodes={};
		/* check values */
		if ($('input#freeeappid').val()=='')
		{
			swal('Error!','FreeeAppIDを入力して下さい。','error');
			return;
		}
		if ($('input#freeesecret').val()=='')
		{
			swal('Error!','FreeeSecretを入力して下さい。','error');
			return;
		}
		if ($('select#doctype').val()=='')
		{
			swal('Error!','書類種別を指定して下さい。','error');
			return;
		}
		if ($('select#doc_reference_id').val()=='')
		{
			swal('Error!','書類番号を指定して下さい。','error');
			return;
		}
		if ($('select#doc_status').val()=='')
		{
			swal('Error!','発行ステータスを指定して下さい。','error');
			return;
		}
		if ($('select#issue_date').val()=='')
		{
			swal('Error!','発生日を指定して下さい。','error');
			return;
		}
		if ($('select#breakdown').val()=='')
		{
			swal('Error!','品名を指定して下さい。','error');
			return;
		}
		if ($('select#unit_price').val()=='')
		{
			swal('Error!','単価を指定して下さい。','error');
			return;
		}
		if ($('select#qty').val()=='')
		{
			swal('Error!','数量を指定して下さい。','error');
			return;
		}
		if ($('select#doc_url').val()=='')
		{
			swal('Error!','Freee書類URLを指定して下さい。','error');
			return;
		}
		if ($('input#license').val().length==0)
		{
			swal('Error!','ライセンス認証URLを入力して下さい。','error');
			return;
		}
		tablecodes['breakdown']=($('select#breakdown').val().length!=0)?vars.fieldinfos[$('select#breakdown').val()].tablecode:'';
		tablecodes['unit_price']=($('select#unit_price').val().length!=0)?vars.fieldinfos[$('select#unit_price').val()].tablecode:'';
		tablecodes['qty']=($('select#qty').val().length!=0)?vars.fieldinfos[$('select#qty').val()].tablecode:'';
		tablecodes['unit']=($('select#unit').val().length!=0)?vars.fieldinfos[$('select#unit').val()].tablecode:'';
		tablecodes['account_item_id']=($('select#account_item_id').val().length!=0)?vars.fieldinfos[$('select#account_item_id').val()].tablecode:'';
		tablecodes['item_name']=($('select#item_name').val().length!=0)?vars.fieldinfos[$('select#item_name').val()].tablecode:'';
		tablecodes['section_name']=($('select#section_name').val().length!=0)?vars.fieldinfos[$('select#section_name').val()].tablecode:'';
		if (tablecodes['breakdown']!=tablecodes['unit_price'])
		{
			swal('Error!','品名と単価の指定は同一テーブルにして下さい。','error');
			return;
		}
		if (tablecodes['breakdown']!=tablecodes['qty'])
		{
			swal('Error!','品名と数量の指定は同一テーブルにして下さい。','error');
			return;
		}
		if ($('select#unit').val().length!=0)
			if (tablecodes['breakdown']!=tablecodes['unit'])
			{
				swal('Error!','品名と単位の指定は同一テーブルにして下さい。','error');
				return;
			}
		if ($('select#account_item_id').val().length!=0)
			if (tablecodes['breakdown']!=tablecodes['account_item_id'])
			{
				swal('Error!','品名と勘定科目IDの指定は同一テーブルにして下さい。','error');
				return;
			}
		if ($('select#item_name').val().length!=0)
			if (tablecodes['breakdown']!=tablecodes['item_name'])
			{
				swal('Error!','品名と品目名の指定は同一テーブルにして下さい。','error');
				return;
			}
		if ($('select#section_name').val().length!=0)
			if (tablecodes['breakdown']!=tablecodes['section_name'])
			{
				swal('Error!','品名と部門名の指定は同一テーブルにして下さい。','error');
				return;
			}
		if (tablecodes['unit_price']!=tablecodes['qty'])
		{
			swal('Error!','単価と数量の指定は同一テーブルにして下さい。','error');
			return;
		}
		if ($('select#unit').val().length!=0)
			if (tablecodes['unit_price']!=tablecodes['unit'])
			{
				swal('Error!','単価と単位の指定は同一テーブルにして下さい。','error');
				return;
			}
		if ($('select#account_item_id').val().length!=0)
			if (tablecodes['unit_price']!=tablecodes['account_item_id'])
			{
				swal('Error!','単価と勘定科目IDの指定は同一テーブルにして下さい。','error');
				return;
			}
		if ($('select#item_name').val().length!=0)
			if (tablecodes['unit_price']!=tablecodes['item_name'])
			{
				swal('Error!','単価と品目名の指定は同一テーブルにして下さい。','error');
				return;
			}
		if ($('select#section_name').val().length!=0)
			if (tablecodes['unit_price']!=tablecodes['section_name'])
			{
				swal('Error!','単価と部門名の指定は同一テーブルにして下さい。','error');
				return;
			}
		if ($('select#unit').val().length!=0)
			if (tablecodes['qty']!=tablecodes['unit'])
			{
				swal('Error!','数量と単位の指定は同一テーブルにして下さい。','error');
				return;
			}
		if ($('select#account_item_id').val().length!=0)
			if (tablecodes['qty']!=tablecodes['account_item_id'])
			{
				swal('Error!','数量と勘定科目IDの指定は同一テーブルにして下さい。','error');
				return;
			}
		if ($('select#item_name').val().length!=0)
			if (tablecodes['qty']!=tablecodes['item_name'])
			{
				swal('Error!','数量と品目名の指定は同一テーブルにして下さい。','error');
				return;
			}
		if ($('select#section_name').val().length!=0)
			if (tablecodes['qty']!=tablecodes['section_name'])
			{
				swal('Error!','数量と部門名の指定は同一テーブルにして下さい。','error');
				return;
			}
		if ($('select#unit').val().length!=0 && $('select#account_item_id').val().length!=0)
			if (tablecodes['unit']!=tablecodes['account_item_id'])
			{
				swal('Error!','単位と勘定科目IDの指定は同一テーブルにして下さい。','error');
				return;
			}
		if ($('select#unit').val().length!=0 && $('select#item_name').val().length!=0)
			if (tablecodes['unit']!=tablecodes['item_name'])
			{
				swal('Error!','単位と品目名の指定は同一テーブルにして下さい。','error');
				return;
			}
		if ($('select#unit').val().length!=0 && $('select#section_name').val().length!=0)
			if (tablecodes['unit']!=tablecodes['section_name'])
			{
				swal('Error!','単位と部門名の指定は同一テーブルにして下さい。','error');
				return;
			}
		if ($('select#account_item_id').val().length!=0 && $('select#item_name').val().length!=0)
			if (tablecodes['account_item_id']!=tablecodes['item_name'])
			{
				swal('Error!','勘定科目IDと品目名の指定は同一テーブルにして下さい。','error');
				return;
			}
		if ($('select#account_item_id').val().length!=0 && $('select#section_name').val().length!=0)
			if (tablecodes['account_item_id']!=tablecodes['section_name'])
			{
				swal('Error!','勘定科目IDと部門名の指定は同一テーブルにして下さい。','error');
				return;
			}
		if ($('select#item_name').val().length!=0 && $('select#section_name').val().length!=0)
			if (tablecodes['item_name']!=tablecodes['section_name'])
			{
				swal('Error!','品目名と部門名の指定は同一テーブルにして下さい。','error');
				return;
			}
		/* setup config */
		config['freeeappid']=$('input#freeeappid').val();
		config['freeesecret']=$('input#freeesecret').val();
		config['license']=$('input#license').val();
		config['taxshift']=$('select#taxshift').val();
		config['doctype']=$('select#doctype').val();
		config['company_info']=$('select#company_info').val();
		config['doc_reference_id']=$('select#doc_reference_id').val();
		config['doc_status']=$('select#doc_status').val();
		config['issue_date']=$('select#issue_date').val();
		config['sales_added_date']=$('select#sales_added_date').val();
		config['payment_date']=$('select#payment_date').val();
		config['partner_id']=$('select#partner_id').val();
		config['partner_name']=$('select#partner_name').val();
		config['partner_zipcode']=$('select#partner_zipcode').val();
		config['partner_prefecture_code']=$('select#partner_prefecture_code').val();
		config['partner_address1']=$('select#partner_address1').val();
		config['partner_address2']=$('select#partner_address2').val();
		config['partner_info']=$('select#partner_info').val();
		config['description']=$('select#description').val();
		config['bank_info']=$('select#bank_info').val();
		config['notes']=$('select#notes').val();
		config['breakdown']=$('select#breakdown').val();
		config['unit_price']=$('select#unit_price').val();
		config['qty']=$('select#qty').val();
		config['unit']=$('select#unit').val();
		config['account_item_id']=$('select#account_item_id').val();
		config['item_name']=$('select#item_name').val();
		config['section_name']=$('select#section_name').val();
		config['doc_url']=$('select#doc_url').val();
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);