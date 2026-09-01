import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const layout = JSON.parse(await readFile(resolve("workspace", "trinkets_loadout", "ir.yaml"), "utf8"));
const uiPath = resolve("RP", "ui", "dorios_trinkets_menu.json");
const source = await readFile(uiPath, "utf8");
const ui = JSON.parse(source.replace(/\/\/.*$/gmu, ""));

const playerControls = [
  {
    player_preview_border: {
      type: "image",
      texture: "textures/ui/player_preview_border",
      size: [54, 72],
      layer: 1,
      anchor_from: "top_left",
      anchor_to: "top_left",
      offset: [28, 9],
    },
  },
  {
    player_bg: {
      type: "image",
      texture: "textures/ui/Black",
      size: [52, 70],
      layer: 2,
      anchor_from: "top_left",
      anchor_to: "top_left",
      offset: [29, 10],
      controls: [{
        player_renderer_panel: {
          type: "panel",
          size: [28, 28],
          offset: [0, -14],
          controls: [{
            player_renderer: {
              type: "custom",
              renderer: "live_player_renderer",
              property_bag: { "#look_at_cursor": true },
              animation_reset_name: "screen_animation_reset",
              anims: [
                "@common.screen_exit_size_animation_push",
                "@common.screen_exit_size_animation_pop",
                "@common.screen_entrance_size_animation_push",
                "@common.screen_entrance_size_animation_pop",
              ],
              layer: 8,
              anchor_from: "center",
              anchor_to: "center",
            },
          }],
        },
      }],
    },
  },
];

const slotControls = layout.elements.map(element => ({
  "item@common.container_item": {
    anchor_from: "top_left",
    anchor_to: "top_left",
    offset: element.pos,
    $cell_overlay_ref: `trinkets.${element.overlay}`,
    collection_index: element.collection_index,
  },
}));

ui.trinkets_top.size = layout.panel.size;
ui.trinkets_top.offset = layout.panel.pos;
ui.trinkets_top.controls = [...playerControls, ...slotControls];

const root = ui.trinket_panel.controls
  .find(control => control["root_panel@common.root_panel"])["root_panel@common.root_panel"];
const commonPanel = root.controls
  .find(control => control["common_panel@common.common_panel"])["common_panel@common.common_panel"];
commonPanel.size = layout.root.size;

await writeFile(uiPath, `${JSON.stringify(ui, null, 4)}\n`);
console.log(`Generated ${layout.elements.length} slot controls in ${uiPath}.`);
