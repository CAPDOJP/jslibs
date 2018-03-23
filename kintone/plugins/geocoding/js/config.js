/*
*--------------------------------------------------------------------
* jQuery-Plugin "geocoding -config.js-"
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
		excludeviewtable:null,
		informationtable:null
	};
	/*---------------------------------------------------------------
	 initialize fields
	---------------------------------------------------------------*/
	kintone.api(kintone.api.url('/k/v1/app/views',true),'GET',{app:kintone.app.getId()},function(resp){
		$.each(resp.views,function(key,values){
			$('select#excludeview').append($('<option>').attr('value',values.id).text(key));
		});
		kintone.api(kintone.api.url('/k/v1/form',true),'GET',{app:kintone.app.getId()},function(resp){
			var config=kintone.plugin.app.getConfig(PLUGIN_ID);
			$.each(resp.properties,function(index,values){
				/* check field type */
				switch (values.type)
				{
					case 'NUMBER':
						/* exclude lookup */
						if (!values.lookup)
						{
							/* check scale */
							if (values.displayScale)
								if (values.displayScale>8)
								{
									$('select#lat').append($('<option>').attr('value',values.code).text(values.label));
									$('select#lng').append($('<option>').attr('value',values.code).text(values.label));
								}
						}
						break;
					case 'SINGLE_LINE_TEXT':
						/* exclude lookup */
						if (!values.lookup)
						{
							$('select#address').append($('<option>').attr('value',values.code).text(values.label));
							$('select#information').append($('<option>').attr('value',values.code).text(values.label));
						}
						break;
					case 'SPACER':
						$('select#spacer').append($('<option>').attr('value',values.elementId).text(values.elementId));
						break;
				}
			});
			/* initialize valiable */
			vars.excludeviewtable=$('.excludeviews').adjustabletable({
				add:'img.add',
				del:'img.del'
			});
			vars.informationtable=$('.informations').adjustabletable({
				add:'img.add',
				del:'img.del'
			});
			var add=false;
			var row=null;
			var excludeviews=[];
			var informations=[];
			if (Object.keys(config).length!==0)
			{
				excludeviews=JSON.parse(config['excludeview']);
				informations=JSON.parse(config['information']);
				$('select#address').val(config['address']);
				$('select#lat').val(config['lat']);
				$('select#lng').val(config['lng']);
				$('select#spacer').val(config['spacer']);
				$('input#mapheight').val(config['mapheight']);
				$('input#apikey').val(config['apikey']);
				if (config['map']=='1') $('input#map').prop('checked',true);
				if (config['usegeocoder']=='1') $('input#usegeocoder').prop('checked',true);
				add=false;
				$.each(excludeviews,function(index){
					if (add) vars.excludeviewtable.addrow();
					else add=true;
					row=vars.excludeviewtable.rows.last();
					$('select#excludeview',row).val(excludeviews[index]);
				});
				add=false;
				$.each(informations,function(index){
					if (add) vars.informationtable.addrow();
					else add=true;
					row=vars.informationtable.rows.last();
					$('select#information',row).val(informations[index]);
				});
			}
			else $('input#mapheight').val('50');
		},function(error){});
	});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var row=null;
		var config=[];
		var excludeviews=[];
		var informations=[];
		/* check values */
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
		if ($('select#lat').val()==$('select#lng').val())
		{
			swal('Error!','緯度表示フィールドと経度表示フィールドは異なるフィールドを選択して下さい。','error');
			return;
		}
		if ($('input#map').prop('checked'))
		{
			if ($('input#mapheight').val()=='') $('input#mapheight').val('50');
			if (!$.isNumeric($('input#mapheight').val()))
			{
				swal('Error!','一覧地図高さは数値を入力して下さい。','error');
				return;
			}
			for (var i=0;i<vars.excludeviewtable.rows.length;i++)
			{
				row=vars.excludeviewtable.rows.eq(i);
				if ($('select#excludeview',row).val().length!=0) excludeviews.push($('select#excludeview',row).val());
			}
			for (var i=0;i<vars.informationtable.rows.length;i++)
			{
				row=vars.informationtable.rows.eq(i);
				if ($('select#information',row).val().length!=0) informations.push($('select#information',row).val());
			}
			if ($('input#apikey').val()=='')
			{
				swal('Error!','Google Maps APIキーを入力して下さい。','error');
				return;
			}
		}
		/* setup config */
		config['address']=$('select#address').val();
		config['lat']=$('select#lat').val();
		config['lng']=$('select#lng').val();
		config['spacer']=$('select#spacer').val();
		config['map']=($('input#map').prop('checked'))?'1':'0';
		config['mapheight']=$('input#mapheight').val();
		config['usegeocoder']=($('input#usegeocoder').prop('checked'))?'1':'0';
		config['apikey']=$('input#apikey').val();
		config['excludeview']=JSON.stringify(excludeviews);
		config['information']=JSON.stringify(informations);
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);