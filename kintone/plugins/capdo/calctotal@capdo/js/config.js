/*
*--------------------------------------------------------------------
* jQuery-Plugin "calctotal -config.js-"
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
		summaryviewtable:null,
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
			$('select#summaryview').append($('<option>').attr('value',values.id).text(key));
		});
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
										$('select#total').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
										$('select#benefit').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
										break;
								}
								break;
							case 'DROP_DOWN':
							case 'RADIO_BUTTON':
								$('select#benefitsegment').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								break;
							case 'NUMBER':
								$('select#total').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#benefit').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								break;
						}
					}
				});
				/* initialize valiable */
				vars.summaryviewtable=$('.summaryviews').adjustabletable({
					add:'img.add',
					del:'img.del'
				});
				var add=false;
				var row=null;
				var summaryviews=[];
				if (Object.keys(config).length!==0)
				{
					summaryviews=JSON.parse(config['summaryview']);
					$('input#license').val(config['license']);
					$('select#total').val(config['total']);
					$('select#benefit').val(config['benefit']);
					$('select#benefitsegment').val(config['benefitsegment']);
					for (var i=0;i<summaryviews.length;i++)
					{
						if (add) vars.summaryviewtable.addrow();
						else add=true;
						row=vars.summaryviewtable.rows.last();
						$('select#summaryview',row).val(summaryviews[i]);
					}
				}
			});
		},function(error){});
	});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var row=null;
		var config=[];
		var summaryviews=[];
		/* check values */
		if ($('select#total').val()=='')
		{
			swal('Error!','合計金額を指定して下さい。','error');
			return;
		}
		if ($('select#benefit').val()=='')
		{
			swal('Error!','粗利金額を指定して下さい。','error');
			return;
		}
		if ($('select#benefitsegment').val()=='')
		{
			swal('Error!','粗利内訳を指定して下さい。','error');
			return;
		}
		for (var i=0;i<vars.summaryviewtable.rows.length;i++)
		{
			row=vars.summaryviewtable.rows.eq(i);
			if ($('select#summaryview',row).val().length!=0) summaryviews.push($('select#summaryview',row).val());
		}
		if ($('input#license').val().length==0)
		{
			swal('Error!','ライセンス認証URLを入力して下さい。','error');
			return;
		}
		/* setup config */
		config['license']=$('input#license').val();
		config['total']=$('select#total').val();
		config['benefit']=$('select#benefit').val();
		config['benefitsegment']=$('select#benefitsegment').val();
		config['summaryview']=JSON.stringify(summaryviews);
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);