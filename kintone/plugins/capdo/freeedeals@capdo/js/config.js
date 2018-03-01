/*
*--------------------------------------------------------------------
* jQuery-Plugin "freeedeals -config.js-"
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
									$('select#amount').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
									$('select#from_walletable_amount').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
									break;
							}
							break;
						case 'DATE':
							if (fieldinfo.tablecode.length==0)
							{
								$('select#issue_date').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#due_date').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							}
							$('select#from_walletable_date').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
						case 'NUMBER':
							if (fieldinfo.tablecode.length==0)
							{
								$('select#partner_id').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#ref_number').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							}
							$('select#amount').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							$('select#account_item_id').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							$('select#tax_code').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							$('select#item_id').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							$('select#section_id').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							$('select#from_walletable_id').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							$('select#from_walletable_amount').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
						case 'SINGLE_LINE_TEXT':
							if (fieldinfo.tablecode.length==0)
							{
								$('select#ref_number').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							}
							$('select#description').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							$('select#from_walletable_type').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
					}
				}
			});
			if (Object.keys(config).length!==0)
			{
				$('input#freeeappid').val(config['freeeappid']);
				$('input#freeesecret').val(config['freeesecret']);
				$('input#license').val(config['license']);
				$('select#issue_date').val(config['issue_date']);
				$('select#due_date').val(config['due_date']);
				$('select#partner_id').val(config['partner_id']);
				$('select#ref_number').val(config['ref_number']);
				$('select#amount').val(config['amount']);
				$('select#account_item_id').val(config['account_item_id']);
				$('select#tax_code').val(config['tax_code']);
				$('select#item_id').val(config['item_id']);
				$('select#section_id').val(config['section_id']);
				$('select#description').val(config['description']);
				$('select#from_walletable_date').val(config['from_walletable_date']);
				$('select#from_walletable_type').val(config['from_walletable_type']);
				$('select#from_walletable_id').val(config['from_walletable_id']);
				$('select#from_walletable_amount').val(config['from_walletable_amount']);
				if (config['addwalletable']=='1') $('input#addwalletable').prop('checked',true);
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
		if ($('select#issue_date').val()=='')
		{
			swal('Error!','発生日を指定して下さい。','error');
			return;
		}
		if ($('select#amount').val()=='')
		{
			swal('Error!','取引金額を指定して下さい。','error');
			return;
		}
		if ($('select#account_item_id').val()=='')
		{
			swal('Error!','勘定科目IDを指定して下さい。','error');
			return;
		}
		if ($('select#tax_code').val()=='')
		{
			swal('Error!','税区分コードを指定して下さい。','error');
			return;
		}
		if ($('input#addwalletable').prop('checked'))
		{
			if ($('select#from_walletable_date').val()=='')
			{
				swal('Error!','決済日を指定して下さい。','error');
				return;
			}
			if ($('select#from_walletable_type').val()=='')
			{
				swal('Error!','口座区分を指定して下さい。','error');
				return;
			}
			if ($('select#from_walletable_id').val()=='')
			{
				swal('Error!','口座IDを指定して下さい。','error');
				return;
			}
			if ($('select#from_walletable_amount').val()=='')
			{
				swal('Error!','決済金額を指定して下さい。','error');
				return;
			}
		}
		if ($('input#license').val().length==0)
		{
			swal('Error!','ライセンス認証URLを入力して下さい。','error');
			return;
		}
		tablecodes['amount']=($('select#amount').val().length!=0)?vars.fieldinfos[$('select#amount').val()].tablecode:'';
		tablecodes['account_item_id']=($('select#account_item_id').val().length!=0)?vars.fieldinfos[$('select#account_item_id').val()].tablecode:'';
		tablecodes['tax_code']=($('select#tax_code').val().length!=0)?vars.fieldinfos[$('select#tax_code').val()].tablecode:'';
		tablecodes['item_id']=($('select#item_id').val().length!=0)?vars.fieldinfos[$('select#item_id').val()].tablecode:'';
		tablecodes['section_id']=($('select#section_id').val().length!=0)?vars.fieldinfos[$('select#section_id').val()].tablecode:'';
		tablecodes['description']=($('select#description').val().length!=0)?vars.fieldinfos[$('select#description').val()].tablecode:'';
		tablecodes['from_walletable_date']=($('select#from_walletable_date').val().length!=0)?vars.fieldinfos[$('select#from_walletable_date').val()].tablecode:'';
		tablecodes['from_walletable_type']=($('select#from_walletable_type').val().length!=0)?vars.fieldinfos[$('select#from_walletable_type').val()].tablecode:'';
		tablecodes['from_walletable_id']=($('select#from_walletable_id').val().length!=0)?vars.fieldinfos[$('select#from_walletable_id').val()].tablecode:'';
		tablecodes['from_walletable_amount']=($('select#from_walletable_amount').val().length!=0)?vars.fieldinfos[$('select#from_walletable_amount').val()].tablecode:'';
		if (tablecodes['amount']!=tablecodes['account_item_id'])
		{
			swal('Error!','取引金額と勘定科目IDの指定は同一テーブルにして下さい。','error');
			return;
		}
		if (tablecodes['amount']!=tablecodes['tax_code'])
		{
			swal('Error!','取引金額と税区分コードの指定は同一テーブルにして下さい。','error');
			return;
		}
		if ($('select#item_id').val().length!=0)
			if (tablecodes['amount']!=tablecodes['item_id'])
			{
				swal('Error!','取引金額と品目IDの指定は同一テーブルにして下さい。','error');
				return;
			}
		if ($('select#section_id').val().length!=0)
			if (tablecodes['amount']!=tablecodes['section_id'])
			{
				swal('Error!','取引金額と部門IDの指定は同一テーブルにして下さい。','error');
				return;
			}
		if ($('select#description').val().length!=0)
			if (tablecodes['amount']!=tablecodes['description'])
			{
				swal('Error!','取引金額と備考の指定は同一テーブルにして下さい。','error');
				return;
			}
		if (tablecodes['account_item_id']!=tablecodes['tax_code'])
		{
			swal('Error!','勘定科目IDと税区分コードの指定は同一テーブルにして下さい。','error');
			return;
		}
		if ($('select#item_id').val().length!=0)
			if (tablecodes['account_item_id']!=tablecodes['item_id'])
			{
				swal('Error!','勘定科目IDと品目IDの指定は同一テーブルにして下さい。','error');
				return;
			}
		if ($('select#section_id').val().length!=0)
			if (tablecodes['account_item_id']!=tablecodes['section_id'])
			{
				swal('Error!','勘定科目IDと部門IDの指定は同一テーブルにして下さい。','error');
				return;
			}
		if ($('select#description').val().length!=0)
			if (tablecodes['account_item_id']!=tablecodes['description'])
			{
				swal('Error!','勘定科目IDと備考の指定は同一テーブルにして下さい。','error');
				return;
			}
		if ($('select#item_id').val().length!=0)
			if (tablecodes['tax_code']!=tablecodes['item_id'])
			{
				swal('Error!','税区分コードと品目IDの指定は同一テーブルにして下さい。','error');
				return;
			}
		if ($('select#section_id').val().length!=0)
			if (tablecodes['tax_code']!=tablecodes['section_id'])
			{
				swal('Error!','税区分コードと部門IDの指定は同一テーブルにして下さい。','error');
				return;
			}
		if ($('select#description').val().length!=0)
			if (tablecodes['tax_code']!=tablecodes['description'])
			{
				swal('Error!','税区分コードと備考の指定は同一テーブルにして下さい。','error');
				return;
			}
		if ($('select#item_id').val().length!=0 && $('select#section_id').val().length!=0)
			if (tablecodes['item_id']!=tablecodes['section_id'])
			{
				swal('Error!','品目IDと部門IDの指定は同一テーブルにして下さい。','error');
				return;
			}
		if ($('select#item_id').val().length!=0 && $('select#description').val().length!=0)
			if (tablecodes['item_id']!=tablecodes['description'])
			{
				swal('Error!','品目IDと備考の指定は同一テーブルにして下さい。','error');
				return;
			}
		if ($('select#section_id').val().length!=0 && $('select#description').val().length!=0)
			if (tablecodes['section_id']!=tablecodes['description'])
			{
				swal('Error!','部門IDと備考の指定は同一テーブルにして下さい。','error');
				return;
			}
		if (tablecodes['from_walletable_date']!=tablecodes['from_walletable_type'])
		{
			swal('Error!','決済日と口座区分の指定は同一テーブルにして下さい。','error');
			return;
		}
		if (tablecodes['from_walletable_date']!=tablecodes['from_walletable_id'])
		{
			swal('Error!','決済日と口座IDの指定は同一テーブルにして下さい。','error');
			return;
		}
		if (tablecodes['from_walletable_date']!=tablecodes['from_walletable_amount'])
		{
			swal('Error!','決済日と決済金額の指定は同一テーブルにして下さい。','error');
			return;
		}
		if (tablecodes['from_walletable_type']!=tablecodes['from_walletable_id'])
		{
			swal('Error!','口座区分と口座IDの指定は同一テーブルにして下さい。','error');
			return;
		}
		if (tablecodes['from_walletable_type']!=tablecodes['from_walletable_amount'])
		{
			swal('Error!','口座区分と決済金額の指定は同一テーブルにして下さい。','error');
			return;
		}
		if (tablecodes['from_walletable_id']!=tablecodes['from_walletable_amount'])
		{
			swal('Error!','口座IDと決済金額の指定は同一テーブルにして下さい。','error');
			return;
		}
		/* setup config */
		config['freeeappid']=$('input#freeeappid').val();
		config['freeesecret']=$('input#freeesecret').val();
		config['license']=$('input#license').val();
		config['issue_date']=$('select#issue_date').val();
		config['due_date']=$('select#due_date').val();
		config['partner_id']=$('select#partner_id').val();
		config['ref_number']=$('select#ref_number').val();
		config['amount']=$('select#amount').val();
		config['account_item_id']=$('select#account_item_id').val();
		config['tax_code']=$('select#tax_code').val();
		config['item_id']=$('select#item_id').val();
		config['section_id']=$('select#section_id').val();
		config['description']=$('select#description').val();
		config['from_walletable_date']=$('select#from_walletable_date').val();
		config['from_walletable_type']=$('select#from_walletable_type').val();
		config['from_walletable_id']=$('select#from_walletable_id').val();
		config['from_walletable_amount']=$('select#from_walletable_amount').val();
		config['addwalletable']=($('input#addwalletable').prop('checked'))?'1':'0';
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);