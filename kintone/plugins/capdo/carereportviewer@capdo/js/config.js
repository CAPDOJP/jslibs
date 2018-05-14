/*
*--------------------------------------------------------------------
* jQuery-Plugin "carereportviewer -config.js-"
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
		fieldtable:null,
		viewtable:null,
		verifytable:null,
		fieldinfos:{},
		colors:[
			'#FA8273',
			'#FFF07D',
			'#7DC87D',
			'#69B4C8',
			'#827DB9',
			'#E16EA5',
			'#FA7382',
			'#FFB46E',
			'#B4DC69',
			'#64C3AF',
			'#69A0C8',
			'#B473B4',
			'#FFFFFF',
			'#2B2B2B'
		]
	};
	var functions={
		fieldsort:function(layout){
			var codes=[];
			$.each(layout,function(index,values){
				switch (values.type)
				{
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
	kintone.api(kintone.api.url('/k/v1/app/views',true),'GET',{app:kintone.app.getId()},function(resp){
		$.each(resp.views,function(key,values){
			$('select#excludeview').append($('<option>').attr('value',values.id).text(key));
		});
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
							case 'DROP_DOWN':
							case 'NUMBER':
							case 'RADIO_BUTTON':
							case 'SINGLE_LINE_TEXT':
								$('select#verifyfield').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								break;
						}
						$('select#excludefield').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
					}
				});
				vars.fieldtable=$('.excludefields').adjustabletable({
					add:'img.add',
					del:'img.del'
				});
				vars.viewtable=$('.excludeviews').adjustabletable({
					add:'img.add',
					del:'img.del'
				});
				vars.verifytable=$('.verifyfields').adjustabletable({
					add:'img.add',
					del:'img.del',
					addcallback:function(row){
						$('input#verifyforecolor',row).val(vars.colors[vars.colors.length-1].replace('#',''));
						$('input#verifybackcolor',row).val(vars.colors[vars.colors.length-2].replace('#',''));
						$('span#verifyforecolor',row).colorSelector(vars.colors,$('input#verifyforecolor',row));
						$('span#verifybackcolor',row).colorSelector(vars.colors,$('input#verifybackcolor',row));
						$('span#verifyforecolor',row).css({'color':'#757575'});
						$('span#verifybackcolor',row).css({'color':'#757575'});
					}
				});
				var add=false;
				var row=null;
				var fields=[];
				var views=[];
				var verifys=[];
				if (Object.keys(config).length!==0)
				{
					fields=config['excludefield'].split(',');
					views=config['excludeview'].split(',');
					verifys=JSON.parse(config['verifyfield']);;
					$('input#license').val(config['license']);
					add=false;
					$.each(fields,function(index){
						if (add) vars.fieldtable.addrow();
						else add=true;
						row=vars.fieldtable.rows.last();
						$('select#excludefield',row).val(fields[index]);
					});
					add=false;
					$.each(views,function(index){
						if (add) vars.viewtable.addrow();
						else add=true;
						row=vars.viewtable.rows.last();
						$('select#excludeview',row).val(views[index]);
					});
					add=false;
					$.each(verifys,function(key,values){
						if (add) vars.verifytable.addrow();
						else add=true;
						row=vars.verifytable.rows.last();
						$('select#verifyfield',row).val(key);
						$('select#verifydecision',row).val(values.decision);
						$('input#verifyvalue',row).val(values.value);
						$('input#verifyforecolor',row).val(values.forecolor);
						$('input#verifybackcolor',row).val(values.backcolor);
						$('span#verifyforecolor',row).colorSelector(vars.colors,$('input#verifyforecolor',row));
						$('span#verifybackcolor',row).colorSelector(vars.colors,$('input#verifybackcolor',row));
					});
				}
			},function(error){});
		},function(error){});
	});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var row=null;
		var config=[];
		var fields=[];
		var views=[];
		var verifys={};
		/* check values */
		for (var i=0;i<vars.viewtable.rows.length;i++)
		{
			row=vars.viewtable.rows.eq(i);
			if ($('select#excludeview',row).val().length!=0) views.push($('select#excludeview',row).val());
		}
		for (var i=0;i<vars.fieldtable.rows.length;i++)
		{
			row=vars.fieldtable.rows.eq(i);
			if ($('select#excludefield',row).val().length!=0) fields.push($('select#excludefield',row).val());
		}
		for (var i=0;i<vars.verifytable.rows.length;i++)
		{
			row=vars.verifytable.rows.eq(i);
			if ($('select#verifyfield',row).val().length!=0)
				if ($('input#verifyvalue',row).val().length==0)
				{
					swal('Error!','比較値を入力して下さい。','error');
					return;
				}
				else
				{
					if (!$.isNumeric($('input#verifyvalue',row).val()))
					{
						swal('Error!','比較値は数値を入力して下さい。','error');
						return;
					}
					else
					{
						verifys[$('select#verifyfield',row).val()]={
							value:$('input#verifyvalue',row).val(),
							decision:$('select#verifydecision',row).val(),
							forecolor:$('input#verifyforecolor',row).val(),
							backcolor:$('input#verifybackcolor',row).val()
						};
					}
				}
		}
		if ($('input#license').val().length==0)
		{
			swal('Error!','ライセンス認証URLを入力して下さい。','error');
			return;
		}
		/* setup config */
		config['excludeview']=views.join(',');
		config['excludefield']=fields.join(',');
		config['verifyfield']=JSON.stringify(verifys);;
		config['license']=$('input#license').val();
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);