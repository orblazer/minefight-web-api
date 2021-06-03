import { prop, modelOptions, getModelForClass, Ref } from '@typegoose/typegoose'

@modelOptions({ schemaOptions: { collection: 'permission_groups' } })
export class PermissionGroup {
  @prop({ required: true })
  public name!: string

  @prop({ required: true })
  public displayName!: string

  @prop({ required: true })
  public prefix!: string

  @prop({ required: true })
  public suffix!: string

  @prop({ required: true, ref: () => PermissionGroup })
  public inherit!: Ref<PermissionGroup>

  @prop({ required: true, type: Boolean })
  public permissions!: Map<string, boolean>
}

export const PermissionGroupModel = getModelForClass(PermissionGroup)
