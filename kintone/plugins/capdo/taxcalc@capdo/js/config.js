/*
*--------------------------------------------------------------------
* jQuery-Plugin "taxcalc -config.js-"
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
		relationtable:null,
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
							if (fieldinfo.tablecode.length==0)
								$('select#taxdate').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
						case 'NUMBER':
							if (fieldinfo.tablecode.length==0)
							{
								$('select#subtotal').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#subtotal_free').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#tax').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							}
							else
							{
								$('select#unitprice').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#quantity').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							}
							break;
						case 'DROP_DOWN':
						case 'RADIO_BUTTON':
							if (fieldinfo.tablecode.length!=0)
								$('select#taxsegment').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
					}
				}
			});
			/* initialize valiable */
			vars.relationtable=$('.relations').adjustabletable({
				add:'img.add',
				del:'img.del',
				addcallback:function(row){
					var list=$('select#totax',row);
					var options=[];
					$('select#taxsegment',row).on('change',function(){
						/* initialize field lists */
						list.html('<option value=""></option>');
						if ($(this).val().length!=0)
						{
							options=[vars.fieldinfos[$(this).val()].options.length];
							$.each(vars.fieldinfos[$(this).val()].options,function(key,values){
								options[parseInt(values.index)]=values.label;
							});
							for (var i=0;i<options.length;i++) list.append($('<option>').attr('value',options[i]).text(options[i]));
							if ($.hasData(list[0]))
								if ($.data(list[0],'initialdata').length!=0)
								{
									list.val($.data(list[0],'initialdata'));
									$.data(list[0],'initialdata','');
								}
						}
					})
				}
			});
			var add=false;
			var row=null;
			var relations=[];
			if (Object.keys(config).length!==0)
			{
				relations=JSON.parse(config['relation']);
				$('select#taxdate').val(config['taxdate']);
				$('select#taxround').val(config['taxround']);
				$('select#taxshift').val(config['taxshift']);
				$('input#license').val(config['license']);
				$.each(relations,function(index){
					if (add) vars.relationtable.addrow();
					else add=true;
					row=vars.relationtable.rows.last();
					$('select#subtotal',row).val(relations[index].subtotal);
					$('select#subtotal_free',row).val(relations[index].subtotal_free);
					$('select#tax',row).val(relations[index].tax);
					$('select#unitprice',row).val(relations[index].unitprice);
					$('select#quantity',row).val(relations[index].quantity);
					$('select#taxsegment',row).val(relations[index].taxsegment);
					/* trigger events */
					$.data($('select#totax',row)[0],'initialdata',relations[index].totax);
					$('select#taxsegment',row).trigger('change');
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
		var relations=[];
		/* check values */
		if ($('select#taxdate').val()=='')
		{
			swal('Error!','税率判定日付フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#taxround').val()=='')
		{
			swal('Error!','税端数を選択して下さい。','error');
			return;
		}
		if ($('select#taxshift').val()=='')
		{
			swal('Error!','税転嫁を選択して下さい。','error');
			return;
		}
		for (var i=0;i<vars.relationtable.rows.length;i++)
		{
			row=vars.relationtable.rows.eq(i);
			if ($('select#subtotal',row).val().length==0) continue;
			if ($('select#subtotal_free',row).val().length==0) continue;
			if ($('select#tax',row).val().length==0) continue;
			if ($('select#unitprice',row).val().length==0) continue;
			if ($('select#taxsegment',row).val().length==0) continue;
			if (vars.fieldinfos[$('select#unitprice',row).val()].tablecode!=vars.fieldinfos[$('select#taxsegment',row).val()].tablecode)
			{
				swal('Error!','単価フィールドと課税区分フィールドの指定は同一テーブルにして下さい。','error');
				return;
			}
			if ($('select#quantity',row).val().length!=0)
			{
				if (vars.fieldinfos[$('select#unitprice',row).val()].tablecode!=vars.fieldinfos[$('select#quantity',row).val()].tablecode)
				{
					swal('Error!','単価フィールドと数量フィールドの指定は同一テーブルにして下さい。','error');
					return;
				}
			}
			if ($('select#totax',row).val()=='')
			{
				swal('Error!','課税値を選択して下さい。','error');
				return;
			}
			relations.push({
				subtotal:$('select#subtotal',row).val(),
				subtotal_free:$('select#subtotal_free',row).val(),
				tax:$('select#tax',row).val(),
				unitprice:$('select#unitprice',row).val(),
				quantity:$('select#quantity',row).val(),
				taxsegment:$('select#taxsegment',row).val(),
				totax:$('select#totax',row).val(),
				tablecode:vars.fieldinfos[$('select#unitprice',row).val()].tablecode
			});
		}
		if ($('input#license').val().length==0)
		{
			swal('Error!','ライセンス認証URLを入力して下さい。','error');
			return;
		}
		/* setup config */
		config['taxdate']=$('select#taxdate').val();
		config['taxround']=$('select#taxround').val();
		config['taxshift']=$('select#taxshift').val();
		config['relation']=JSON.stringify(relations);
		config['license']=$('input#license').val();
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);