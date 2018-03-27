/*
*--------------------------------------------------------------------
* jQuery-Plugin "customersinfo -config.js-"
* Version: 1.0
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
		colortable:null,
		colors:[],
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
							else $('select#spacer').append($('<option>').attr('value',values.elementId).text(values.elementId));
						});
						break;
					case 'GROUP':
						$.merge(codes,functions.fieldsort(values.layout));
						break;
				}
			});
			return codes;
		},
		reloadmailings:function(callback){
			/* clear rows */
			var target=$('select#mailing');
			var table=$('.mailings');
			if (target.val().length!=0)
			{
				$.each(table.find('tbody').find('tr'),function(){
					var row=$(this);
					$('select#mailingoption',row).empty();
				})
				var fieldinfo=vars.fieldinfos[target.val()];
				var options=[fieldinfo.options.length];
				$.each(fieldinfo.options,function(key,values){
					options[values.index]=values.label;
				});
				for (var i=0;i<options.length;i++)
				{
					$.each(table.find('tbody').find('tr'),function(){
						var row=$(this);
						$('select#mailingoption',row).append($('<option>').attr('value',options[i]).text(options[i]));
					})
				}
				table.show();
			}
			else table.hide();
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
			/* setup colorfields lists */
			vars.colors=[];
			$.each($.markercolors(),function(index,values){vars.colors.push('#'+values.back);});
			/* initialize valiable */
			$.each(sorted,function(index){
				if (sorted[index] in vars.fieldinfos)
				{
					var fieldinfo=vars.fieldinfos[sorted[index]];
					/* check field type */
					switch (fieldinfo.type)
					{
						case 'CHECK_BOX':
							$('select#mailingsync').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
						case 'DATE':
							$('select#datespan').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
						case 'FILE':
							$('select#barcodeimage').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
						case 'MODIFIER':
							$('select#modifier').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
						case 'NUMBER':
							/* exclude lookup */
							if (!fieldinfo.lookup)
							{
								/* check scale */
								if (fieldinfo.displayScale)
									if (fieldinfo.displayScale>8)
									{
										$('select#lat').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
										$('select#lng').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
									}
							}
							break;
						case 'RADIO_BUTTON':
							$('select#action').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							$('select#mailing').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
						case 'SINGLE_LINE_TEXT':
							/* exclude lookup */
							if (!fieldinfo.lookup)
							{
								$('select#zip').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#zip1').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#zip2').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#address').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#information').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#barcodetext').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#familyname').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#givenname').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#destination').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							}
							break;
					}
				}
			});
			/* initialize valiable */
			vars.colortable=$('.colors').adjustabletable({
				add:'img.add',
				del:'img.del',
				addcallback:function(row){
					$('input#datespancolor',row).val(vars.colors[0].replace('#',''));
					$('span#datespancolor',row).colorSelector(vars.colors,$('input#datespancolor',row));
				}
			});
			if (Object.keys(config).length!==0) $('select#mailing').val(config['mailing']);
			functions.reloadmailings(function(){
				if (Object.keys(config).length!==0)
				{
					$('select#zip').val(config['zip']);
					$('select#zip1').val(config['zip1']);
					$('select#zip2').val(config['zip2']);
					$('select#address').val(config['address']);
					$('select#lat').val(config['lat']);
					$('select#lng').val(config['lng']);
					$('select#spacer').val(config['spacer']);
					$('select#information').val(config['information']);
					$('select#action').val(config['action']);
					$('select#datespan').val(config['datespan']);
					$('select#modifier').val(config['modifier']);
					$('select#barcodetext').val(config['barcodetext']);
					$('select#barcodeimage').val(config['barcodeimage']);
					$('select#familyname').val(config['familyname']);
					$('select#givenname').val(config['givenname']);
					$('select#destination').val(config['destination']);
					$('input#defaultcolor').val(config['defaultcolor']);
					var add=false;
					var datespancolors=JSON.parse(config['datespancolors']);
					$.each(datespancolors,function(key,values){
						if (add) vars.colortable.addrow();
						else add=true;
						var row=vars.colortable.rows.last();
						$('input#datespanday',row).val(key);
						$('input#datespancolor',row).val(values);
					});
					$('input#markersize').val(config['markersize']);
					$('input#markerfont').val(config['markerfont']);
					$('input#apikey').val(config['apikey']);
					if (config['mailingoptions'])
					{
						var mailingoptions=JSON.parse(config['mailingoptions']);
						$.each($('.mailings').find('tbody').find('tr'),function(index){
							var row=$(this);
							$('select#mailingoption',row).val(mailingoptions[index].option);
							$('select#mailingsync',row).val(mailingoptions[index].sync);
						});
					}
					if (config['usebarcode']=='1') $('input#usebarcode').prop('checked',true);
					if (config['usedestination']=='1') $('input#usedestination').prop('checked',true);
					if (config['chasemode']=='1') $('input#chasemode').prop('checked',true);
				}
				else
				{
					$('input#markersize').val('34');
					$('input#markerfont').val('11');
					$('input#defaultcolor').val(vars.colors[0].replace('#',''));
					$.each($('input#datespancolor'),function(){$(this).val(vars.colors[0].replace('#',''))});
				}
			});
			$('select#mailing').on('change',function(){functions.reloadmailings()});
			$('span#defaultcolor').colorSelector(vars.colors,$('input#defaultcolor'));
			$.each($('span#datespancolor'),function(index){
				$(this).colorSelector(vars.colors,$(this).closest('tr').find('input#datespancolor'));
			});
		});
	},function(error){});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var error=false;
		var config=[];
		var datespancolors={};
		var mailingoptions=[];
		/* check values */
		if ($('select#zip').val()=='')
		{
			swal('Error!','郵便番号入力フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#zip1').val()=='')
		{
			swal('Error!','郵便番号上3桁フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#zip2').val()=='')
		{
			swal('Error!','郵便番号下4桁フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#address').val()=='')
		{
			swal('Error!','住所入力フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#lat').val()=='')
		{
			swal('Error!','緯度表示フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#lng').val()=='')
		{
			swal('Error!','経度表示フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#spacer').val()=='')
		{
			swal('Error!','地図表示フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#information').val()=='')
		{
			swal('Error!','表示フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#action').val()=='')
		{
			swal('Error!','ピン操作フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#datespan').val()=='')
		{
			swal('Error!','経過日数算出フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#modifier').val()=='')
		{
			swal('Error!','更新者フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#lat').val()==$('select#lng').val())
		{
			swal('Error!','緯度表示フィールドと経度表示フィールドは異なるフィールドを選択して下さい。','error');
			return;
		}
		if (!$('input#defaultcolor').val())
		{
			swal('Error!','マーカー規定色を選択して下さい。','error');
			return;
		}
		if ($('input#defaultcolor').val()=='')
		{
			swal('Error!','マーカー規定色を選択して下さい。','error');
			return;
		}
		for (var i=0;i<vars.colortable.rows.length;i++)
		{
			var row=vars.colortable.rows.eq(i);
			if ($('input#datespanday',row).val().length!=0)
			{
				if ($('input#datespancolor',row).val()=='')
				{
					swal('Error!','マーカー色を選択して下さい。','error');
					error=true;
				}
				datespancolors[$('input#datespanday',row).val().toString()]=$('input#datespancolor',row).val();
			}
		}
		if ($('input#markersize').val()=='') $('input#markersize').val('34');
		if (!$.isNumeric($('input#markersize').val()))
		{
			swal('Error!','マーカーサイズは数値を入力して下さい。','error');
			return;
		}
		if ($('input#markerfont').val()=='') $('input#markerfont').val('11');
		if (!$.isNumeric($('input#markerfont').val()))
		{
			swal('Error!','マーカーフォントサイズは数値を入力して下さい。','error');
			return;
		}
		if ($('input#apikey').val()=='')
		{
			swal('Error!','Google Maps APIキーを入力して下さい。','error');
			return;
		}
		if ($('input#usebarcode').prop('checked'))
		{
			if ($('select#barcodetext').val()=='')
			{
				swal('Error!','郵便バーコードフィールドを選択して下さい。','error');
				return;
			}
			if ($('select#barcodeimage').val()=='')
			{
				swal('Error!','郵便バーコード画像フィールドを選択して下さい。','error');
				return;
			}
		}
		if ($('input#usedestination').prop('checked'))
		{
			if ($('select#barcodetext').val()=='')
			{
				swal('Error!','郵便バーコードフィールドを選択して下さい。','error');
				return;
			}
			if ($('select#familyname').val()=='')
			{
				swal('Error!','姓フィールドを選択して下さい。','error');
				return;
			}
			if ($('select#givenname').val()=='')
			{
				swal('Error!','名フィールドを選択して下さい。','error');
				return;
			}
			if ($('select#destination').val()=='')
			{
				swal('Error!','宛名フィールドを選択して下さい。','error');
				return;
			}
			if ($('select#mailing').val()=='')
			{
				swal('Error!','郵送判定フィールドを選択して下さい。','error');
				return;
			}
			$.each($('.mailings').find('tbody').find('tr'),function(index){
				var row=$(this);
				mailingoptions.push({
					option:$('select#mailingoption',row).val(),
					sync:$('select#mailingsync',row).val()
				});
			})
		}
		if (error) return;
		/* setup config */
		config['app']=kintone.app.getId().toString();
		config['zip']=$('select#zip').val();
		config['zip1']=$('select#zip1').val();
		config['zip2']=$('select#zip2').val();
		config['address']=$('select#address').val();
		config['lat']=$('select#lat').val();
		config['lng']=$('select#lng').val();
		config['spacer']=$('select#spacer').val();
		config['information']=$('select#information').val();
		config['action']=$('select#action').val();
		config['datespan']=$('select#datespan').val();
		config['modifier']=$('select#modifier').val();
		config['barcodetext']=$('select#barcodetext').val();
		config['barcodeimage']=$('select#barcodeimage').val();
		config['familyname']=$('select#familyname').val();
		config['givenname']=$('select#givenname').val();
		config['destination']=$('select#destination').val();
		config['mailing']=$('select#mailing').val();
		config['defaultcolor']=$('input#defaultcolor').val();
		config['markersize']=$('input#markersize').val();
		config['markerfont']=$('input#markerfont').val();
		config['apikey']=$('input#apikey').val();
		config['usebarcode']=($('input#usebarcode').prop('checked'))?'1':'0';
		config['usedestination']=($('input#usedestination').prop('checked'))?'1':'0';
		config['chasemode']=($('input#chasemode').prop('checked'))?'1':'0';
		config['datespancolors']=JSON.stringify(datespancolors);
		config['mailingoptions']=JSON.stringify(mailingoptions);
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);