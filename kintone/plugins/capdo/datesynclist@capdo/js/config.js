/*
*--------------------------------------------------------------------
* jQuery-Plugin "datesynclist -config.js-"
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
		relationtable:null
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
				case 'DATE':
					$('select#date').append($('<option>').attr('value',values.code).text(values.label));
					break;
				case 'DROP_DOWN':
				case 'RADIO_BUTTON':
					$('select#dropdown').append($('<option>').attr('value',values.code).text(values.label));
					break;
			}
		});
		/* initialize valiable */
		vars.relationtable=$('.relations').adjustabletable({
			add:'img.add',
			del:'img.del',
			addcallback:function(row){
				var list=$('select#item',row);
				var options=[];
				$('select#dropdown',row).on('change',function(){
					/* initialize field lists */
					list.html('<option value=""></option>');
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
				})
			}
		});
		var add=false;
		var row=null;
		var relations=[];
		if (Object.keys(config).length!==0)
		{
			relations=JSON.parse(config['relation']);
			$('input#license').val(config['license']);
			$.each(relations,function(index){
				if (add) vars.relationtable.addrow();
				else add=true;
				row=vars.relationtable.rows.last();
				$('select#date',row).val(relations[index].date);
				$('select#dropdown',row).val(relations[index].dropdown);
				/* trigger events */
				$.data($('select#item',row)[0],'initialdata',relations[index].item);
				$('select#dropdown',row).trigger('change');
			});
		}
		else
		{
			$('input#year').val('0');
			$('input#month').val('0');
			$('input#day').val('0');
		}
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
		for (var i=0;i<vars.relationtable.rows.length;i++)
		{
			row=vars.relationtable.rows.eq(i);
			if ($('select#date',row).val().length==0) continue;
			if ($('select#dropdown',row).val().length==0) continue;
			if ($('select#item',row).val().length==0) continue;
			relations.push({
				date:$('select#date',row).val(),
				dropdown:$('select#dropdown',row).val(),
				item:$('select#item',row).val()
			});
		}
		if ($('input#license').val().length==0)
		{
			swal('Error!','ライセンス認証URLを入力して下さい。','error');
			return;
		}
		/* setup config */
		config['relation']=JSON.stringify(relations);
		config['license']=$('input#license').val();
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);